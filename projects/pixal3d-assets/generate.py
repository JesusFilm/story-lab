#!/usr/bin/env python3
"""Generate through the existing private Pixal3D API over authenticated SSH.

Never reads .env. Raw server/job records stay outside the source repository.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import struct
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlencode


def request(host, path, data=None):
    command = ['curl', '--fail-with-body', '--silent', '--show-error',
               '--connect-timeout', '5', '--max-time', '120']
    if data is not None:
        command += ['-H', 'Content-Type: application/octet-stream', '--data-binary', '@-']
    command += ['http://127.0.0.1:7860' + path]
    result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
                             host, shlex.join(command)], input=data or b'',
                            capture_output=True, timeout=150)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace') + result.stdout.decode(errors='replace')[:1000])
    return result.stdout


def validate_glb(data):
    if len(data) < 20 or struct.unpack('<4sII', data[:12]) != (b'glTF', 2, len(data)):
        raise RuntimeError('Invalid or truncated GLB')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--ssh', default=os.environ.get('PIXAL3D_SSH_HOST'))
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--resolution', type=int, choices=[1024, 1536], default=1024)
    parser.add_argument('--resume', help='Resume polling/download of an existing job UUID; never resubmit')
    parser.add_argument('--state-dir', type=Path,
                        default=Path(tempfile.gettempdir()) / 'story-lab-pixal3d-jobs')
    args = parser.parse_args()
    if not args.ssh or not re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9_.@-]*', args.ssh):
        parser.error('Pass --ssh USER@HOST or set PIXAL3D_SSH_HOST')
    if not 0 <= args.seed <= 4294967295:
        parser.error('Seed must be in 0..4294967295')
    if args.resume and not re.fullmatch(r'[a-f0-9-]{36}', args.resume):
        parser.error('--resume must be a job UUID')
    output = args.output.resolve()
    provenance = output.with_suffix('.provenance.json')
    if output.exists() or provenance.exists():
        parser.error('Refusing to overwrite model or provenance; choose a new output name')
    repo = Path(__file__).resolve().parents[2]
    state_dir = args.state_dir.resolve()
    if state_dir == repo or repo in state_dir.parents:
        parser.error('Raw job state must be outside the repository')
    data = args.image.read_bytes()
    if not 0 < len(data) <= 20 * 1024 * 1024:
        parser.error('Image must be 1 byte to 20 MiB')
    state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    job_id = args.resume
    try:
        health = json.loads(request(args.ssh, '/health'))
        if health.get('service') != 'pixal3d' or health.get('status') != 'ok':
            raise RuntimeError('Pixal3D is not healthy')
        if not job_id:
            query = urlencode(dict(filename=args.image.name, seed=args.seed, resolution=args.resolution))
            job = json.loads(request(args.ssh, '/jobs?' + query, data))
            job_id = job['id']
        record = state_dir / (job_id + '.json')
        print(f'Job {job_id}; recovery record: {record}', flush=True)
        while True:
            job = json.loads(request(args.ssh, '/jobs/' + job_id))
            if job.get('input_sha256') != hashlib.sha256(data).hexdigest():
                raise RuntimeError('Reference image does not match the submitted job; use its original input')
            record.write_text(json.dumps(job, indent=2) + '\n')
            record.chmod(0o600)
            print(f"{job['state']} · {job.get('elapsed_seconds', 0):.0f}s", flush=True)
            if job['state'] in {'succeeded', 'failed', 'cancelled'}:
                break
            time.sleep(5)
        if job['state'] != 'succeeded':
            raise RuntimeError(job.get('error') or job['state'])
        metadata = json.loads(request(args.ssh, f'/jobs/{job_id}/metadata'))
        record.write_text(json.dumps(metadata, indent=2) + '\n')
        model = request(args.ssh, f'/jobs/{job_id}/artifact')
        digest = hashlib.sha256(model).hexdigest()
        if digest != job['output_sha256']:
            raise RuntimeError('Downloaded model checksum mismatch')
        validate_glb(model)
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open('xb') as stream:
            stream.write(model)
        # Deliberate allowlist: never put job IDs, logs, hostnames or credentials in assets.
        summary = {'generator': 'TencentARC/Pixal3D',
                   'source': 'https://github.com/TencentARC/Pixal3D',
                   'upstream_revision': job.get('upstream_revision'),
                   'low_vram': job.get('low_vram'),
                   'seed': job['seed'], 'resolution': job['resolution'],
                   'elapsed_seconds': job['elapsed_seconds'],
                   'reference_sha256': hashlib.sha256(data).hexdigest(),
                   'model_sha256': digest, 'model_bytes': len(model),
                   'review': 'Generated source; render and assess before runtime use.'}
        with provenance.open('x') as stream:
            json.dump(summary, stream, indent=2)
            stream.write('\n')
        print(output)
        return 0
    except KeyboardInterrupt:
        if job_id:
            try:
                request(args.ssh, f'/jobs/{job_id}/cancel', b'')
                print('Cancellation requested; inspect the job until resources are released.', file=sys.stderr)
            except Exception:
                print(f'Cancellation unconfirmed. Inspect job {job_id}.', file=sys.stderr)
        return 130
    except (RuntimeError, OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(str(error), file=sys.stderr)
        if job_id:
            print(f'Resume with --resume {job_id}; do not submit a duplicate.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
