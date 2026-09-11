import { analyse, criteriaChecks } from './graph.mjs';
import { random } from './config.mjs';

// Deliberately independent of the drawing code and graph traversal helpers.
function flood(mask,width,height,start) {
  const seen = new Uint8Array(mask.length), q = new Int32Array(mask.length);
  if (!mask[start]) return { seen, count:0 };
  let head=0,tail=1; q[0]=start;seen[start]=1;
  while(head<tail) {
    const i=q[head++],x=i%width;
    for (const n of [x>0?i-1:-1,x+1<width?i+1:-1,i>=width?i-width:-1,i+width<mask.length?i+width:-1])
      if(n>=0&&mask[n]&&!seen[n]) {seen[n]=1;q[tail++]=n;}
  }
  return {seen,count:tail};
}

function clearanceMask(pixels,width,height,playerPixels) {
  // Integral image gives exact collision for a conservatively rounded square
  // footprint at every pixel centre, including bends and corner posts.
  const stride=width+1, sum=new Uint32Array(stride*(height+1));
  for(let y=0;y<height;y++) {let row=0;for(let x=0;x<width;x++){row+=pixels[y*width+x]===0?1:0;sum[(y+1)*stride+x+1]=sum[y*stride+x+1]+row;}}
  const mask=new Uint8Array(pixels.length), before=Math.floor(playerPixels/2),after=playerPixels-before;
  for(let y=before;y+after<=height;y++)for(let x=before;x+after<=width;x++){
    const x0=x-before,x1=x+after,y0=y-before,y1=y+after;
    mask[y*width+x]=sum[y1*stride+x1]-sum[y0*stride+x1]-sum[y1*stride+x0]+sum[y0*stride+x0]===0?1:0;
  }
  return mask;
}

export function simulate(maze, runs=maze.config.simulationRuns) {
  const a=maze.adjacency, rows=[], rng=random(`${maze.config.seed}:agents:${maze.attempt}`), budget=a.length*12;
  // Memory explorer takes the least promising geometric branch first and
  // backtracks explicitly. It must still escape within a complete DFS budget.
  const seen=new Set([maze.start]), stack=[maze.start], trace=[maze.start];let steps=0;
  while(stack.length&&stack.at(-1)!==maze.exit&&steps<2*a.length){
    const here=stack.at(-1),available=a[here].filter(n=>!seen.has(n));
    available.sort((x,y)=>distance(y)-distance(x)||x-y);
    if(available.length){const next=available[0];seen.add(next);stack.push(next);trace.push(next);}else{stack.pop();if(stack.length)trace.push(stack.at(-1));}
    steps++;
  }
  rows.push({name:'Adversarial memory explorer',runs:1,completed:stack.at(-1)===maze.exit?1:0,steps,required:true});
  let wallDone=0,wallSteps=0;
  for(const hand of [-1,1]){
    let here=maze.start,dir=1;const states=new Set();let n=0;
    while(here!==maze.exit&&n<budget){const key=here*4+dir;if(states.has(key))break;states.add(key);
      let moved=false;for(const delta of [hand,0,-hand,2]){const d=(dir+delta+4)%4;const next=[here-maze.config.columns,here+1,here+maze.config.columns,here-1][d];if(a[here].includes(next)){here=next;dir=d;moved=true;break;}}
      if(!moved)break;n++;
    }
    if(here===maze.exit)wallDone++;wallSteps+=n;
  }
  rows.push({name:'Left / right wall followers',runs:2,completed:wallDone,steps:wallSteps,required:false});
  let completed=0,total=0,max=0;
  for(let run=0;run<runs;run++){
    let here=maze.start,previous=-1,n=0;
    while(here!==maze.exit&&n<budget){let options=a[here].filter(v=>v!==previous);if(!options.length)options=a[here];if(!options.length)break;
      const next=options[Math.floor(rng()*options.length)];previous=here;here=next;n++;}
    if(here===maze.exit)completed++;total+=n;max=Math.max(max,n);
  }
  rows.push({name:'Seeded explorers without memory',runs,completed,steps:total,meanSteps:Math.round(total/runs),maxSteps:max,budgetPerRun:budget,required:false});
  return {rows,adversarialTrace:trace,passed:rows[0].completed===1,note:'Memory traversal is required. Wall followers and random walkers are bounded diagnostics: loops can trap them. These are not human difficulty scores.'};
  function distance(id){return Math.abs(id%maze.config.columns-maze.exit%maze.config.columns)+Math.abs(Math.floor(id/maze.config.columns)-Math.floor(maze.exit/maze.config.columns));}
}

export function verify(maze,raster,_unusedMetrics) {
  const c=maze.config,a=maze.adjacency,n=c.columns*c.rows, checks=[];
  const add=(id,label,pass,actual,target='required')=>checks.push({id,label,pass,actual,target});
  let graphOK=Array.isArray(a)&&a.length===n&&a.every(Array.isArray)&&Number.isInteger(maze.start)&&Number.isInteger(maze.exit)&&maze.start>=0&&maze.start<n&&maze.exit>=0&&maze.exit<n&&maze.start!==maze.exit;
  for(let id=0;graphOK&&id<a.length;id++) {
    if(!Array.isArray(a[id])||new Set(a[id]).size!==a[id].length){graphOK=false;break;}
    for(const next of a[id]) if(!Number.isInteger(next)||next<0||next>=n||!a[next]?.includes(id)||Math.abs(id%c.columns-next%c.columns)+Math.abs(Math.floor(id/c.columns)-Math.floor(next/c.columns))!==1)graphOK=false;
  }
  add('graph-integrity','Reciprocal, orthogonal graph',graphOK,graphOK?'valid':'invalid');
  const expectedWall=Math.max(1,Math.round((c.wallMode==='uniform'?c.wallThickness:c.thickWall)*c.pixelsPerMetre));
  const pitch=expectedWall+Math.round(c.passageWidth*c.pixelsPerMetre),width=c.columns*pitch+expectedWall,height=c.rows*pitch+expectedWall;
  const shapeOK=raster.width===width&&raster.height===height&&raster.pixels?.length===width*height;
  add('raster-size','Raster matches physical size contract',shapeOK,`${raster.width} × ${raster.height}`,`${width} × ${height}`);
  if(!graphOK||!shapeOK)return {passed:false,checks,metrics:null,simulations:null};
  const pixels=raster.pixels,walk=new Uint8Array(pixels.length);let white=0,binary=true;
  for(let i=0;i<pixels.length;i++){if(pixels[i]!==0&&pixels[i]!==255)binary=false;if(pixels[i]===255){walk[i]=1;white++;}}
  add('binary','Only black and white pixels',binary,binary?'0 / 255':'invalid values');
  let frame=true;for(let x=0;x<width;x++)if(pixels[x]||pixels[(height-1)*width+x])frame=false;
  for(let y=0;y<height;y++)if(pixels[y*width]||pixels[y*width+width-1])frame=false;
  add('boundary','Closed outer boundary',frame,frame?'sealed':'leak');
  const centre=id=>({x:Math.floor(expectedWall/2+(id%c.columns+0.5)*pitch),y:Math.floor(expectedWall/2+(Math.floor(id/c.columns)+0.5)*pitch)});
  const index=id=>{const p=centre(id);return p.y*width+p.x;};
  const fill=flood(walk,width,height,index(maze.start));
  add('connected-pixels','Every walkable pixel is reachable',fill.count===white&&white>0,`${fill.count} / ${white}`);
  const clear=clearanceMask(pixels,width,height,Math.ceil(c.playerWidth*c.pixelsPerMetre));
  const safeFill=flood(clear,width,height,index(maze.start));
  const allCells=Array.from({length:n},(_,i)=>i).every(id=>safeFill.seen[index(id)]);
  add('clearance','Player footprint reaches every cell',allCells,allCells?`${n} cells`:'blocked cell',`${c.playerWidth} m square`);
  // Every open graph edge must admit a straight swept footprint. Every closed
  // edge's entire dividing strip must be black: catches pinholes and shortcuts.
  let openOK=true,closedOK=true,openCount=0,closedCount=0;
  for(let id=0;id<n;id++)for(const next of [id%c.columns+1<c.columns?id+1:-1,id+c.columns<n?id+c.columns:-1])if(next>=0){
    const p=centre(id),q=centre(next),isOpen=a[id].includes(next);
    if(isOpen){openCount++;for(let y=p.y;y<=q.y;y++)for(let x=p.x;x<=q.x;x++)if(!clear[y*width+x])openOK=false;}
    else{closedCount++;
      if(q.x>p.x){const x=(id%c.columns+1)*pitch+Math.floor(expectedWall/2),y0=Math.floor(id/c.columns)*pitch;
        for(let y=y0;y<y0+pitch+expectedWall;y++)if(pixels[y*width+x]!==0)closedOK=false;
      }else{const y=(Math.floor(id/c.columns)+1)*pitch+Math.floor(expectedWall/2),x0=id%c.columns*pitch;
        for(let x=x0;x<x0+pitch+expectedWall;x++)if(pixels[y*width+x]!==0)closedOK=false;
      }
    }
  }
  add('open-passages','Swept player clears every open passage',openOK,`${openCount} passages`);
  add('closed-walls','Closed walls contain no shortcuts',closedOK,`${closedCount} segments`);
  const reached=new Set([maze.start]),queue=[maze.start];for(let i=0;i<queue.length;i++)for(const next of a[queue[i]])if(!reached.has(next)){reached.add(next);queue.push(next);}
  add('connected-graph','All cells connect to the exit',reached.size===n,reached.size,n);
  const metrics=analyse(maze);checks.push(...criteriaChecks(metrics,c));
  const simulations=simulate(maze);
  add('simulation','Adversarial traversal reaches the exit',simulations.passed,simulations.rows[0].steps,'≤ 2 × cells');
  return {passed:checks.every(x=>x.pass),checks,metrics,simulations};
}
