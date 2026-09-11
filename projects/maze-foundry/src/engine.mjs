import { resolveConfig, random } from './config.mjs';
import { neighbours, shortestPath, analyse, criteriaChecks } from './graph.mjs';
import { rasterize } from './raster.mjs';
import { verify } from './verify.mjs';

export function generateCandidate(config, attempt = 0) {
  const c = resolveConfig(config), rng = random(`${c.seed}:graph:${attempt}`), count = c.columns * c.rows;
  const adjacency = Array.from({ length: count }, () => []), seen = new Uint8Array(count), active = [0]; seen[0] = 1;
  const connect = (a,b) => { adjacency[a].push(b); adjacency[b].push(a); };
  while (active.length) {
    const index = rng() < c.branchBias ? active.length - 1 : Math.floor(rng() * active.length), node = active[index];
    const available = neighbours(node, c.columns, c.rows).filter(n => !seen[n]);
    if (!available.length) { active.splice(index, 1); continue; }
    const next = available[Math.floor(rng() * available.length)]; connect(node, next); seen[next] = 1; active.push(next);
  }
  // Label branches by their attachment to the solution. Joining different labels
  // creates a useful alternative route, instead of counting irrelevant side loops.
  const route = shortestPath(adjacency, 0, count-1), labels = new Int32Array(count).fill(-1), queue = [...route];
  route.forEach((n,i) => { labels[n] = i; });
  for (let i = 0; i < queue.length; i++) for (const n of adjacency[queue[i]]) if (labels[n] < 0) { labels[n] = labels[queue[i]]; queue.push(n); }
  const walls = [];
  for (let a=0; a<count; a++) for (const b of neighbours(a,c.columns,c.rows)) if (b>a && !adjacency[a].includes(b)) walls.push([a,b,rng()]);
  walls.sort((a,b) => a[2]-b[2]);
  let usefulLoops = 0;
  for (const [a,b] of walls) {
    const useful = labels[a] !== labels[b];
    const protectDeadEnd = adjacency[a].length === 1 || adjacency[b].length === 1;
    if ((useful && usefulLoops < c.minWinPaths - 1) || (!protectDeadEnd && rng() < c.loopProbability)) {
      connect(a,b); if (useful) usefulLoops++;
    }
  }
  if (c.minChoiceSpacing > 1) repairChoiceSpacing(adjacency, c, rng);
  adjacency.forEach(ns => ns.sort((a,b)=>a-b));
  return { schemaVersion: 1, algorithm: 'growing-tree-braided-v1', config: c, attempt, start: 0, exit: count-1, adjacency };
}

// Rewire edges while preserving connectivity and cycle count. This is a bounded
// search, not a promise that arbitrary combinations of constraints are feasible.
function repairChoiceSpacing(a,c,rng) {
  const isChoice=id=>a[id].length>=3||(id===0&&a[id].length>=2);
  function score(){let penalty=0;const offenders=[];
    for(let id=0;id<a.length;id++)if(isChoice(id))for(const neighbour of a[id]){
      let prev=id,cur=neighbour,length=1;
      while(length<c.minChoiceSpacing&&!isChoice(cur)&&a[cur].length===2&&cur!==a.length-1){const next=a[cur].find(n=>n!==prev);prev=cur;cur=next;length++;}
      if(isChoice(cur)&&length<c.minChoiceSpacing){penalty+=c.minChoiceSpacing-length;offenders.push(id);}
    }return {penalty,offenders};
  }
  const allEdges=[];for(let id=0;id<a.length;id++)for(const next of neighbours(id,c.columns,c.rows))if(next>id)allEdges.push([id,next]);
  const connect=(x,y)=>{a[x].push(y);a[y].push(x);},disconnect=(x,y)=>{a[x].splice(a[x].indexOf(y),1);a[y].splice(a[y].indexOf(x),1);};
  let current=score();
  for(let step=0;step<Math.min(12000,a.length*30)&&current.penalty;step++){
    const from=current.offenders[Math.floor(rng()*current.offenders.length)],to=a[from][Math.floor(rng()*a[from].length)];disconnect(from,to);
    const reached=new Uint8Array(a.length),queue=[from];reached[from]=1;
    for(let i=0;i<queue.length;i++)for(const n of a[queue[i]])if(!reached[n]){reached[n]=1;queue.push(n);}
    const candidates=allEdges.filter(([x,y])=>!a[x].includes(y)&&!(x===Math.min(from,to)&&y===Math.max(from,to))&&(queue.length===a.length||reached[x]!==reached[y]));
    if(!candidates.length){connect(from,to);continue;}
    const [x,y]=candidates[Math.floor(rng()*candidates.length)];connect(x,y);const next=score();
    // Rare uphill steps escape local optima; cool towards the end of the search.
    const temperature=Math.max(.05,.7*(1-step/Math.min(12000,a.length*30)));
    if(next.penalty<=current.penalty||rng()<Math.exp((current.penalty-next.penalty)/temperature))current=next;
    else{disconnect(x,y);connect(from,to);}
  }
}

export function generate(input = {}, onProgress = () => {}) {
  const c = resolveConfig(input); let best = null, bestScore = Infinity;
  for (let attempt = 0; attempt < c.maxAttempts; attempt++) {
    const maze = generateCandidate(c, attempt), metrics = analyse(maze), checks = criteriaChecks(metrics,c);
    const score = checks.filter(x => !x.pass).length;
    onProgress({ attempt: attempt+1, maxAttempts: c.maxAttempts, failedCriteria: score });
    if (score === 0) {
      const raster = rasterize(maze), report = verify(maze, raster, metrics);
      const result = { maze, raster, report, attempts: attempt+1, passed: report.passed };
      if (report.passed) return result;
      if (bestScore > 0) { best = result; bestScore = 0; }
    } else if (score < bestScore) { best = { maze, metrics }; bestScore = score; }
  }
  if (!best.report) { best.raster = rasterize(best.maze); best.report = verify(best.maze, best.raster, best.metrics); delete best.metrics; }
  return { ...best, attempts: c.maxAttempts, passed: false };
}
