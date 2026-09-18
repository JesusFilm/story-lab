# House 1 rehearsal sound

`resident-refusal.wav` is temporary synthesized dialogue: “Go away! It is late!”
Generated locally with Kokoro-82M's `am_onyx` English male voice at 0.90× speed.
The result is a 24 kHz, 16-bit mono WAV. No real person's recording or identity
is represented.

The three wooden knocks are generated at runtime with short noise transients and
damped resonances in `src/house-scene.mjs`. The voice is preloaded and decoded
through the shared recorded-audio loader before the scene can use it. Subtitles
retain the scene's meaning when audio is unavailable. Voice performance remains
subject to user review; this is rehearsal material, not an approved final
performance or published asset.
