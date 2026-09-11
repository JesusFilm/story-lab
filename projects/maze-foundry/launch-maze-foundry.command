#!/bin/zsh
cd "${0:A:h}" || exit 1
maze_node="$(command -v node)"
if [[ -z "$maze_node" && -x /opt/homebrew/bin/node ]]; then
  maze_node=/opt/homebrew/bin/node
fi
if [[ -z "$maze_node" ]]; then
  print 'Maze Foundry requires Node.js 22 or newer. Install Node, then run this launcher again.'
  read '?Press Return to close.'
  exit 1
fi
"$maze_node" scripts/serve.mjs --open
if [[ $? -ne 0 ]]; then
  read '?Could not start Maze Foundry. Press Return to close.'
fi
