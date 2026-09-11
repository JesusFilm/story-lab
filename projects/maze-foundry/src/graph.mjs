export const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
export function neighbours(id, columns, rows) {
  const x = id % columns, y = Math.floor(id / columns), result = [];
  if (x) result.push(id - 1); if (x < columns - 1) result.push(id + 1);
  if (y) result.push(id - columns); if (y < rows - 1) result.push(id + columns);
  return result;
}
export function shortestPath(adjacency, start, exit, bannedEdges = new Set(), bannedNodes = new Set()) {
  if (bannedNodes.has(start) || bannedNodes.has(exit)) return null;
  const parent = new Int32Array(adjacency.length).fill(-1), queue = new Int32Array(adjacency.length);
  let head = 0, tail = 1; queue[0] = start; parent[start] = start;
  while (head < tail) {
    const node = queue[head++];
    if (node === exit) { const path = [exit]; while (path.at(-1) !== start) path.push(parent[path.at(-1)]); return path.reverse(); }
    for (const next of adjacency[node]) if (parent[next] === -1 && !bannedNodes.has(next) && !bannedEdges.has(edgeKey(node, next))) { parent[next] = node; queue[tail++] = next; }
  }
  return null;
}

// Yen's bounded K shortest loopless routes. Side loops do not count as win paths.
export function winPaths(adjacency, start, exit, limit = 4) {
  const first = shortestPath(adjacency, start, exit);
  if (!first) return [];
  const paths = [first], candidates = new Map();
  while (paths.length < limit) {
    const previous = paths.at(-1);
    for (let i = 0; i < previous.length - 1; i++) {
      const root = previous.slice(0, i + 1), edges = new Set();
      for (const p of paths) if (root.every((v, j) => p[j] === v) && p.length > i + 1) edges.add(edgeKey(p[i], p[i + 1]));
      const spur = shortestPath(adjacency, root.at(-1), exit, edges, new Set(root.slice(0, -1)));
      if (spur) { const path = [...root.slice(0, -1), ...spur], key = path.join(','); if (!paths.some(p => p.join(',') === key)) candidates.set(key, path); }
    }
    if (!candidates.size) break;
    const next = [...candidates.values()].sort((a,b) => a.length - b.length || a.join(',').localeCompare(b.join(',')))[0];
    candidates.delete(next.join(',')); paths.push(next);
  }
  return paths;
}

export function analyse(maze, routeLimit = maze.config.minWinPaths) {
  const { adjacency: a, start, exit, config: c } = maze;
  const choices = a.flatMap((n, i) => n.length >= 3 || (i === start && n.length >= 2) ? [i] : []);
  const choiceSet = new Set(choices), terminals = new Set([...choices, start, exit]);
  const deadEnds = a.flatMap((n, i) => n.length === 1 && i !== start && i !== exit ? [i] : []);
  deadEnds.forEach(v => terminals.add(v));
  const visited = new Set(), corridors = [];
  for (const node of terminals) for (const next of a[node]) {
    if (visited.has(edgeKey(node, next))) continue;
    let prev = node, cur = next; const path = [node, next]; visited.add(edgeKey(node, next));
    while (!terminals.has(cur) && a[cur].length === 2) {
      const n = a[cur].find(v => v !== prev); visited.add(edgeKey(cur, n)); path.push(n); prev = cur; cur = n;
    }
    corridors.push(path);
  }
  const betweenChoices = corridors.filter(p => choiceSet.has(p[0]) && choiceSet.has(p.at(-1)));
  const paths = winPaths(a, start, exit, routeLimit);
  const firstChoice = paths[0]?.findIndex(v => choiceSet.has(v)) ?? -1;
  const edgeCount = a.reduce((s, ns) => s + ns.length, 0) / 2;
  return { choices, deadEnds, corridors, deadEndPaths: corridors.filter(p => deadEnds.includes(p[0]) || deadEnds.includes(p.at(-1))), paths,
    shortestLength: paths[0] ? paths[0].length - 1 : Infinity,
    firstChoice: firstChoice < 0 ? Infinity : firstChoice,
    maxCorridor: Math.max(0, ...corridors.map(p => p.length - 1)),
    minChoiceSpacing: betweenChoices.length ? Math.min(...betweenChoices.map(p => p.length - 1)) : Infinity,
    meanCorridor: corridors.length ? corridors.reduce((s,p) => s+p.length-1,0) / corridors.length : 0,
    cells: c.columns * c.rows, edges: edgeCount, cycleRank: edgeCount - a.length + 1 };
}

export function criteriaChecks(metrics, c) {
  return [
    { id: 'win-paths', label: 'Distinct simple win paths', actual: metrics.paths.length, target: `≥ ${c.minWinPaths}`, pass: metrics.paths.length >= c.minWinPaths },
    { id: 'dead-ends', label: 'Dead ends (excluding start / exit)', actual: metrics.deadEnds.length, target: `≥ ${c.minDeadEnds}`, pass: metrics.deadEnds.length >= c.minDeadEnds },
    { id: 'solution-length', label: 'Shortest win path · steps', actual: metrics.shortestLength, target: `≥ ${c.minSolutionLength}`, pass: metrics.shortestLength >= c.minSolutionLength },
    { id: 'choice-min', label: 'Minimum choice spacing · steps', actual: metrics.minChoiceSpacing, target: `≥ ${c.minChoiceSpacing}`, pass: metrics.minChoiceSpacing >= c.minChoiceSpacing },
    { id: 'corridor-max', label: 'Longest forced corridor · steps', actual: metrics.maxCorridor, target: `≤ ${c.maxCorridorLength}`, pass: metrics.maxCorridor <= c.maxCorridorLength },
    { id: 'first-choice', label: 'First choice · steps', actual: metrics.firstChoice, target: `≤ ${c.maxFirstChoice}`, pass: metrics.firstChoice <= c.maxFirstChoice }
  ];
}
