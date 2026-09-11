export const DEFAULT_CONFIG = Object.freeze({
  seed: 'watch-001', columns: 20, rows: 16,
  passageWidth: 2, wallMode: 'mixed', wallThickness: 1,
  thinWall: 0.5, thickWall: 1.5, thickProbability: 0.4,
  pixelsPerMetre: 8, playerWidth: 1,
  minWinPaths: 2, minDeadEnds: 18, minSolutionLength: 36,
  minChoiceSpacing: 1, maxCorridorLength: 12, maxFirstChoice: 6,
  branchBias: 0.6, loopProbability: 0.04,
  maxAttempts: 80, simulationRuns: 24, wallOverrides: {}
});

export const PRESETS = Object.freeze({
  easy: { columns: 12, rows: 10, minWinPaths: 2, minDeadEnds: 8, minSolutionLength: 20, minChoiceSpacing: 1, maxCorridorLength: 9, maxFirstChoice: 4, branchBias: 0.35, loopProbability: 0.06 },
  balanced: { columns: 20, rows: 16, minWinPaths: 2, minDeadEnds: 18, minSolutionLength: 36, minChoiceSpacing: 1, maxCorridorLength: 12, maxFirstChoice: 6, branchBias: 0.6, loopProbability: 0.04 },
  hard: { columns: 28, rows: 22, minWinPaths: 3, minDeadEnds: 35, minSolutionLength: 70, minChoiceSpacing: 1, maxCorridorLength: 16, maxFirstChoice: 8, branchBias: 0.8, loopProbability: 0.025 }
});

export function resolveConfig(input = {}) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configuration must be an object.');
  for (const key of Object.keys(input)) if (!(key in DEFAULT_CONFIG)) errors.push(`Unknown setting: ${key}`);
  const c = { ...DEFAULT_CONFIG, ...input, wallOverrides: { ...(input.wallOverrides ?? {}) } };
  const check = (key, min, max, integer = false) => {
    if (typeof c[key] !== 'number' || !Number.isFinite(c[key]) || c[key] < min || c[key] > max || (integer && !Number.isInteger(c[key])))
      errors.push(`${key} must be ${integer ? 'an integer' : 'a number'} from ${min} to ${max}.`);
  };
  for (const key of ['columns', 'rows']) check(key, 4, 48, true);
  check('passageWidth', 0.5, 8);
  for (const key of ['wallThickness', 'thinWall', 'thickWall']) check(key, 0.125, 4);
  check('pixelsPerMetre', 2, 24, true); check('playerWidth', 0.125, 8);
  check('minWinPaths', 1, 4, true); check('minDeadEnds', 0, 2304, true);
  check('minSolutionLength', 1, 2303, true);
  check('minChoiceSpacing', 1, 100, true); check('maxCorridorLength', 1, 2303, true);
  check('maxFirstChoice', 1, 2303, true); check('maxAttempts', 1, 200, true);
  check('simulationRuns', 1, 100, true);
  for (const key of ['thickProbability', 'branchBias', 'loopProbability']) check(key, 0, 1);
  if (typeof c.seed !== 'string' || !c.seed.length || c.seed.length > 120) errors.push('seed must contain 1–120 characters.');
  if (!['uniform', 'mixed'].includes(c.wallMode)) errors.push('wallMode must be uniform or mixed.');
  if (c.thinWall > c.thickWall) errors.push('Thin wall cannot be thicker than thick wall.');
  if (c.playerWidth > c.passageWidth) errors.push('Player width exceeds guaranteed passage width.');
  if (c.minChoiceSpacing > c.maxCorridorLength) errors.push('Minimum choice spacing exceeds maximum corridor length.');
  if (c.minDeadEnds > c.columns * c.rows - 2) errors.push('Dead-end target exceeds available interior cells.');
  if (c.minSolutionLength >= c.columns * c.rows) errors.push('Minimum solution length exceeds a simple route through the grid.');
  if (input.wallOverrides === undefined || (input.wallOverrides !== null && typeof input.wallOverrides === 'object' && !Array.isArray(input.wallOverrides))) {
    for (const [id, thickness] of Object.entries(c.wallOverrides)) {
      const m = /^(h|v)-(\d+)-(\d+)$/.exec(id);
      if (!m || (m[1] === 'h' ? (+m[2] >= c.columns || +m[3] < 1 || +m[3] >= c.rows) : (+m[2] < 1 || +m[2] >= c.columns || +m[3] >= c.rows))) errors.push(`Invalid internal wall ID: ${id}`);
      const max = c.wallMode === 'uniform' ? c.wallThickness : c.thickWall;
      const min = c.wallMode === 'uniform' ? c.wallThickness : c.thinWall;
      if (!Number.isFinite(thickness) || thickness < min || thickness > max) errors.push(`${id} thickness must be within the active wall range (${min}–${max} m).`);
    }
  } else errors.push('wallOverrides must be an object mapping segment IDs to metres.');
  if (!errors.length) {
    const s = dimensions(c);
    if (Math.ceil(c.playerWidth * c.pixelsPerMetre) > s.passagePixels) errors.push('Pixel rounding leaves insufficient player clearance. Increase resolution or passage width.');
    if (s.width * s.height > 4_000_000 || Math.max(s.width, s.height) > 4096) errors.push('PNG exceeds the 4 million pixel / 4096 pixel side limit. Reduce dimensions or resolution.');
    if (Math.round(c.thinWall * c.pixelsPerMetre) < 1 || Math.round(c.wallThickness * c.pixelsPerMetre) < 1) errors.push('Wall thickness is below one pixel at this resolution.');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return c;
}

export function dimensions(c) {
  const scale = c.pixelsPerMetre;
  const wallPixels = Math.max(1, Math.round((c.wallMode === 'uniform' ? c.wallThickness : c.thickWall) * scale));
  const passagePixels = Math.max(1, Math.round(c.passageWidth * scale));
  const pitch = wallPixels + passagePixels;
  const width = c.columns * pitch + wallPixels, height = c.rows * pitch + wallPixels;
  return { width, height, pitch, wallPixels, passagePixels, pixelsPerMetre: scale,
    widthMetres: width / scale, heightMetres: height / scale, cellPitchMetres: pitch / scale,
    actualPassageWidth: passagePixels / scale };
}

export function random(seed) {
  let h = 2166136261;
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return () => { h += 0x6D2B79F5; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
