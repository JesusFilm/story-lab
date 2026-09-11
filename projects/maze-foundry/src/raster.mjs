import { dimensions, random } from './config.mjs';

export function cellPixel(maze, raster, id) {
  return { x: Math.floor(raster.wallPixels / 2 + (id % maze.config.columns + 0.5) * raster.pitch),
    y: Math.floor(raster.wallPixels / 2 + (Math.floor(id / maze.config.columns) + 0.5) * raster.pitch) };
}

export function rasterize(maze) {
  const c = maze.config, d = dimensions(c), pixels = new Uint8Array(d.width * d.height).fill(255);
  const rng = random(`${c.seed}:walls:${maze.attempt}`), segments = [];
  const rect = (x,y,w,h) => {
    for (let row=Math.max(0,y); row<Math.min(d.height,y+h); row++) pixels.fill(0,row*d.width+Math.max(0,x),row*d.width+Math.min(d.width,x+w));
  };
  const segment = (id, orientation, x, y) => {
    // Consume RNG even for overrides so a single edit cannot reshuffle other walls.
    const roll = rng(), requested = c.wallMode === 'uniform' ? c.wallThickness : (roll < c.thickProbability ? c.thickWall : c.thinWall);
    const metres = c.wallOverrides[id] ?? requested, thickness = Math.max(1,Math.round(metres * c.pixelsPerMetre));
    const offset = Math.floor(d.wallPixels/2)-Math.floor(thickness/2);
    const box = orientation === 'h' ? { x:x*d.pitch, y:y*d.pitch+offset, w:d.pitch+d.wallPixels, h:thickness }
      : { x:x*d.pitch+offset, y:y*d.pitch, w:thickness, h:d.pitch+d.wallPixels };
    rect(box.x,box.y,box.w,box.h);
    segments.push({ id, orientation, column:x, row:y, thicknessMetres: thickness/c.pixelsPerMetre, requestedThickness:metres, ...box });
  };
  for (let y=0;y<c.rows;y++) for (let x=1;x<c.columns;x++) {
    const right=y*c.columns+x; if (!maze.adjacency[right].includes(right-1)) segment(`v-${x}-${y}`,'v',x,y);
  }
  for (let y=1;y<c.rows;y++) for (let x=0;x<c.columns;x++) {
    const below=y*c.columns+x; if (!maze.adjacency[below].includes(below-c.columns)) segment(`h-${x}-${y}`,'h',x,y);
  }
  // Full-width corner posts seal junctions between differently sized segments.
  for (let y=0;y<=c.rows;y++) for (let x=0;x<=c.columns;x++) rect(x*d.pitch,y*d.pitch,d.wallPixels,d.wallPixels);
  rect(0,0,d.width,d.wallPixels); rect(0,d.height-d.wallPixels,d.width,d.wallPixels);
  rect(0,0,d.wallPixels,d.height); rect(d.width-d.wallPixels,0,d.wallPixels,d.height);
  return { ...d, pixels, segments };
}

export function exportManifest(result) {
  if (!result.passed || !result.report.passed) throw new Error('Export is blocked until all required checks pass.');
  const { maze, raster:r, report } = result;
  const position = id => { const p = cellPixel(maze,r,id); return { cell:id, column:id%maze.config.columns, row:Math.floor(id/maze.config.columns), pixel:p, metres:{x:(p.x+0.5)/r.pixelsPerMetre,z:(p.y+0.5)/r.pixelsPerMetre} }; };
  return { schemaVersion:1, generatorVersion:'0.1.0', algorithm:maze.algorithm, seed:maze.config.seed, attempt:maze.attempt,
    config:maze.config, image:{width:r.width,height:r.height,pixelsPerMetre:r.pixelsPerMetre,origin:'top-left',axes:'pixel x → world +X; pixel y → world +Z',pixelSampling:'pixel centres: (index + 0.5) / pixelsPerMetre',walkableValue:255,wallValue:0,connectivity:4,antialias:false,outerBoundary:'closed; start and exit are interior goal cells'},
    size:{widthMetres:r.widthMetres,heightMetres:r.heightMetres,cellPitchMetres:r.cellPitchMetres,passageWidthMetres:r.actualPassageWidth},
    start:position(maze.start),exit:position(maze.exit),adjacency:maze.adjacency,wallSegments:r.segments,
    verifiedWinPaths:report.metrics.paths,deadEndPaths:report.metrics.deadEndPaths,verification:report };
}
