# Story Lab

**[Explore Story Lab → Play the prototypes and browse the 3D asset gallery](https://jesusfilm.github.io/story-lab/)**

A place to explore biblical stories through games and 3D experiences. Browse an
idea, play an experiment, or copy something useful into your own work.

## Styles

[Visual style guides](styles/README.md) provide shared grounding for images and models.

## Assets

[Models, imagery and references](assets/README.md) are starting material to copy.
Each prototype keeps its own assets, so changes to the collection or another
prototype do not change your experiment. Duplicates are welcome.

## Docs

[Technical notes and handoffs](docs/README.md), including the
[GitHub Pages portal brief](docs/handoffs/github-pages-portal.md).

## Game Concepts

[Story and gameplay ideas](game-concepts/README.md): Shepherd Maze, Shepherd
Adventure, Jerusalem Search and Little Light Library. Concepts can exist without an implementation.

## Projects

[Tools and utilities](projects/README.md): [Maze Foundry](projects/maze-foundry/README.md),
[Kokoro Voice Lab](projects/kokoro-voice-lab/README.md)
Each has its own setup instructions.

## Prototypes

[Playable experiments](prototypes/README.md), each with its own code and assets:

- [Shepherd Maze](prototypes/shepherd-maze/README.md): find the Nativity through
  automatic walking, junction choices and memory; original Blender presentation.
- [Shepherd Adventure](prototypes/shepherd-adventure/README.md): prepare a lantern,
  investigate clues and discover a route to the Nativity.

- [Among the Crowd](prototypes/sermon-in-the-crowd/README.md): explore a sermon
  with audio, timed captions and an internal V1/V2 character selector.

To launch the two shepherd prototypes from this checkout with Python 3.9+ and Node.js 22+:

```sh
python3 prototypes/serve.py
```

Open [Maze](http://127.0.0.1:8765/) or [Adventure](http://127.0.0.1:8766/).
First use downloads pinned Three.js into a temporary cache. Playing needs no
Blender installation or Tripo token. Individual launch instructions are in each README.

To enable the repository's publication pre-commit check after cloning, run:

```sh
./scripts/setup-git-hooks.sh
```

Git keeps hooks local to each checkout, so this one-time setup is required for
each contributor. The hook checks staged portal publication hashes before a commit.
