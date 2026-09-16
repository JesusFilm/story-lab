# Kokoro Voice Lab

Prototype **5**, using **loading option 2 · Follow the lantern**.

An on-device text-to-speech playground for Kokoro-82M on Apple Silicon. Choose
a supported language, select a female or male voice, enter text, generate a WAV,
and play or download the result in the browser. Speech stays on the host Mac
during inference.

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

Generated audio is held in a temporary operating-system directory and removed
when the server exits. The server binds to localhost and limits requests to
5,000 characters. It returns PCM WAV audio at 24 kHz. The multilingual install
includes the optional Japanese and Mandarin phonemizers required by those voices.

## Hosting limitation

This exact implementation cannot run as a static GitHub Pages demo. MLX requires
an Apple Silicon Python host, so a public deployment needs a persistent Mac
server behind HTTPS or a replacement browser/cloud inference backend. The
published GitHub Pages edition therefore provides a playable, downloadable
John 3:16 sample and explains how to run new synthesis locally. The UI is
otherwise ordinary dependency-free HTML, CSS, and JavaScript.
