# ADR 001 — Static TypeScript, Three.js and measured phrase audio

Accepted 2026-09-19. Use Vite with plain TypeScript, a single Three.js renderer and accessible DOM controls. This small prototype does not require a component framework. Story/localization JSON, preferences, reader state and playback are separate modules. Runtime dependencies are copied into the prototype and the build uses a relative base for nested deployment.

Narration is synthesized phrase by phrase in production. The browser decodes the current page only and schedules its buffers on one AudioContext timeline. Highlighting queries that same clock; changing rate reanchors it, pause cancels sources, and mute changes gain without stopping time. These are phrase cues, never estimated word timestamps. A page/language operation invalidates obsolete asynchronous work. Language changes retain the book/page and pause at zero. Tab hiding pauses explicitly.

The initial language chooser unlocks browser audio. Every startup requires activation and preselects the saved locale. No account, remote inference, analytics or live production service is used by the deployed application.
