"""Serve the Kokoro Voice Lab and synthesize speech locally with MLX."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROOT = Path(__file__).resolve().parent
MAX_TEXT_LENGTH = 5_000


class VoiceEngine:
    def __init__(self) -> None:
        self.state = "loading"
        self.message = "Loading Kokoro-82M on this Mac…"
        self.tts = None
        self.voices: list[str] = []
        self.lock = threading.Lock()
        self.output_dir = tempfile.TemporaryDirectory(prefix="story-lab-kokoro-")

    def load(self) -> None:
        try:
            import unidic

            if not (Path(unidic.DICDIR) / "mecabrc").exists():
                self.message = "Downloading the Japanese pronunciation dictionary…"
                subprocess.run(
                    [sys.executable, "-m", "unidic", "download"],
                    check=True,
                )
            from kokoro_mlx import KokoroTTS

            self.tts = KokoroTTS.from_pretrained()
            self.voices = self.tts.list_voices()
            self.state = "ready"
            self.message = f"Ready with {len(self.voices)} voices."
        except Exception as error:  # surfaced to the local UI
            self.state = "error"
            self.message = f"Kokoro could not start: {error}"

    def synthesize(self, text: str, voice: str, speed: float) -> tuple[Path, dict]:
        if self.state != "ready" or self.tts is None:
            raise RuntimeError(self.message)
        if voice not in self.voices:
            raise ValueError("Choose one of the available voices.")
        digest = hashlib.sha256(f"{voice}\0{speed}\0{text}".encode()).hexdigest()[:20]
        path = Path(self.output_dir.name) / f"{digest}.wav"
        with self.lock:
            if path.exists():
                return path, {"cached": True}
            result = self.tts.save(
                text,
                str(path),
                voice=voice,
                speed=speed,
                sample_rate=24_000,
            )
        return path, {
            "cached": False,
            "duration": result.duration,
            "sampleRate": result.sample_rate,
            "voice": result.voice,
        }


ENGINE = VoiceEngine()


class Handler(SimpleHTTPRequestHandler):
    server_version = "StoryLabKokoro/0.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:
        if self.path == "/api/status":
            self.send_json({"state": ENGINE.state, "message": ENGINE.message})
            return
        if self.path == "/api/voices":
            if ENGINE.state != "ready":
                self.send_json(
                    {"state": ENGINE.state, "message": ENGINE.message},
                    HTTPStatus.SERVICE_UNAVAILABLE,
                )
                return
            self.send_json({"voices": ENGINE.voices})
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path != "/api/synthesize":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 25_000:
                raise ValueError("The request is empty or too large.")
            payload = json.loads(self.rfile.read(length))
            text = str(payload.get("text", "")).strip()
            voice = str(payload.get("voice", ""))
            speed = float(payload.get("speed", 1.0))
            if not text:
                raise ValueError("Enter some text to speak.")
            if len(text) > MAX_TEXT_LENGTH:
                raise ValueError(f"Text is limited to {MAX_TEXT_LENGTH:,} characters.")
            if not 0.5 <= speed <= 2.0:
                raise ValueError("Speed must be between 0.5× and 2×.")
            path, metadata = ENGINE.synthesize(text, voice, speed)
            audio = path.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(audio)))
            self.send_header("Content-Disposition", f'inline; filename="{voice}.wav"')
            self.send_header("X-Kokoro-Metadata", json.dumps(metadata, separators=(",", ":")))
            self.end_headers()
            self.wfile.write(audio)
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
        except RuntimeError as error:
            self.send_json({"error": str(error)}, HTTPStatus.SERVICE_UNAVAILABLE)
        except Exception as error:
            self.send_json({"error": f"Synthesis failed: {error}"}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format_string: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {format_string % args}", flush=True)


class LocalServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8770)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("Port must be between 1 and 65535.")
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", args.port))
        except OSError:
            parser.error(f"Port {args.port} is already in use.")

    threading.Thread(target=ENGINE.load, name="kokoro-loader", daemon=True).start()
    server = LocalServer(("127.0.0.1", args.port), Handler)
    print(f"Kokoro Voice Lab: http://127.0.0.1:{args.port}/", flush=True)
    print("Model loading continues in the background. Ctrl+C stops the server.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        if ENGINE.tts is not None:
            ENGINE.tts.close()
        ENGINE.output_dir.cleanup()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
