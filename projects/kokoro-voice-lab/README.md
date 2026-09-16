# Kokoro Voice Lab

An on-device text-to-speech tool for creating Story Lab audio assets with
Kokoro-82M on Apple Silicon. Choose a supported language and voice, enter text,
generate a WAV, listen in the browser, and download the approved result. Text
and inference stay on the host Mac.

This is a local production tool, not a static prototype. MLX requires an Apple
Silicon Mac and cannot run on GitHub Pages.

## Run locally

Requirements: Apple Silicon, macOS 13+, `uv`, and internet access on first run
to install the Python packages, model weights, and language data.

```sh
uv sync --python 3.12
uv run python server.py
```

Open <http://127.0.0.1:8770/>. The server downloads the Japanese pronunciation
dictionary when absent and warms the model in the background; the page reports
each phase and becomes available when synthesis is ready. First launch can take
several minutes and downloads roughly 1 GB across dependencies and language data.

## Generate an audio asset in the browser

1. Start the server and wait for **Ready with 54 voices**.
2. Choose the language/accent and voice. The voice prefix records both, such as
   `af_heart` for American English female or `jf_alpha` for Japanese female.
3. Paste the final reviewed text. Inputs are limited to 5,000 characters; shorter
   passages generally produce more consistent pacing.
4. Set the speaking speed. `1.0×` is the model's native pace; values above it are
   faster. Listen to the complete result before accepting it.
5. Select **Download WAV** and save the file with a descriptive, stable name such
   as `john-3-16-af-heart-105.wav`.
6. Copy the downloaded WAV into the owning prototype or project's asset folder.
   Prototypes must own their copies; do not make them depend on this tool at runtime.
7. Add the new audio to that experience's credits, publication manifest, tests,
   and preload/error handling where applicable.

The browser output is 16-bit mono PCM WAV at 24 kHz. Generated files are cached
only in a temporary operating-system directory and removed when the server exits;
the downloaded copy is the durable asset.

## Generate directly from Python

Use this for a reproducible one-off or a small batch. Run it from this directory
after `uv sync`:

```sh
uv run python - <<'PY'
from kokoro_mlx import KokoroTTS

with KokoroTTS.from_pretrained() as tts:
    tts.save(
        "For God so loved the world that He gave His one and only Son...",
        "john-3-16-af-heart-105.wav",
        voice="af_heart",
        speed=1.05,
        sample_rate=24_000,
    )
PY
```

Keep generated WAV files outside this tool directory or move them into the
specific consumer's asset folder; `*.wav` is ignored here to prevent accidental
check-in of drafts.

## Languages and voices

The installed model exposes 54 voices across American English, British English,
Spanish, French, Hindi, Italian, Japanese, Brazilian Portuguese, and Mandarin
Chinese. Female and male voices are available where the model provides them.
Japanese and Mandarin use the multilingual phonemizer dependencies; the server
installs the Japanese UniDic data automatically when absent.

Review pronunciation, names, numbers, pauses, and sentence boundaries by ear.
Different voices can interpret the same punctuation differently. For long
scripts, generate and review coherent sections rather than one very long input.

## Runtime behavior

The server binds only to `127.0.0.1`, limits requests to 5,000 characters, and
serializes synthesis through one loaded model. It requires macOS 13+, Apple
Silicon, Python 3.10–3.12, and Metal access. Generated speech is not uploaded to
a third-party speech service; initial dependency, model, and dictionary downloads
do require internet access.

Kokoro model weights are Apache 2.0; the `kokoro-mlx` inference package is MIT.
Confirm the rights and attribution requirements for the source text and the
destination experience independently.
