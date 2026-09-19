# Prototypes

Independent playable experiments. Each prototype owns its code and asset copies.
Copy assets from the [collection](../assets/README.md) or another prototype into
your own folder, then change that copy as needed.

| Prototype | Experience | Local URL |
|---|---|---|
| [Shepherd Maze](shepherd-maze/README.md) | Automatic walking, junction choices and memory; Blender/Tripo presentations. | [8765](http://127.0.0.1:8765/) |
| [Shepherd Adventure](shepherd-adventure/README.md) | Lantern preparation, clues and discovery on the journey to the Nativity. | [8766](http://127.0.0.1:8766/) |
| [Among the Crowd](sermon-in-the-crowd/README.md) | Walk through a sermon with audio, captions and V1/V2 characters. | [8767](http://127.0.0.1:8767/) |
| [Little Light Library](little-light-library/README.md) | Two illustrated Bible books with multilingual narration in a child’s bedroom. | [8771](http://127.0.0.1:8771/) |
| [Story Diorama Lab](story-diorama-lab/README.md) | Explore story playback, image transitions, scrolling text and soundtrack timing with Noah. | [8769](http://127.0.0.1:8769/) |

Among the Crowd runs independently with `npm run dev:static -- --port 8767` from
its directory. See its README for installation and static export.

From the repository root, run `python3 prototypes/serve.py` to start both shepherd prototypes.
Python 3.9+, Node.js 22+ and a WebGL 2 browser are needed. First use downloads
pinned Three.js 0.169.0 to a temporary cache. No Blender or Tripo token is needed.

Each shepherd prototype also runs independently with its own `python3 serve.py`.
The combined launcher accepts `--maze-port` and `--adventure-port`.

`python3 prototypes/verify-isolation.py` checks both experiments from temporary
standalone copies, including asset loading and the existing gameplay checks.

[Shepherd Maze visual retrospective](shepherd-maze/learnings/retrospective.html):
why the original mechanism struggled and what to test in a future maze.

## Loading animation assignments

Stable creation numbers determine the loading animation, repeating 1 → 2 → 3.
Append new prototypes to this registry; never renumber existing entries.

| Number | Prototype | Loading option |
|---|---|---|
| 1 | Shepherd Maze | 1 · Sheep theatre |
| 2 | Shepherd Adventure | 2 · Follow the lantern |
| 3 | Among the Crowd | 3 · A village unfolds |
| 4 | Story Diorama Lab | 1 · Sheep theatre |
| 5 | Little Light Library | 2 · Follow the lantern |

The next prototype is **6 → A village unfolds**; **7 → Sheep theatre**.
See [loader instructions](../assets/loading-indicators/README.md) for installation.
