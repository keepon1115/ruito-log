// Pixel sprite — char-grid maps rendered to SVG <rect>s (mock's pixelmap method),
// with one map per growth stage. Row 5 = eyes, row 7 = mouth are overlaid per mood.
import type { GrowthStage } from './age';

export const C: Record<string, string> = {
  o: '#6b4a52', // outline
  h: '#9a6a4e', // hair
  s: '#FCE0C9', // skin
  c: '#F49AC1', // cheek
  e: '#50424A', // eye
  m: '#E86F9E', // mouth
  b: '#5BC8C4', // body
  w: '#C9F0EE', // belly highlight
};

export const EYES_OPEN = '_oscseescso_';
export const EYES_CLOSED = '_osceeeecso_';
export const M_SMALL = '_osssmmssso_';
export const M_BIG = '_ossmmmmsso_';

// Each stage shares the head outline (cols 1/10, rows 2-8) so the eye (row 5) and
// mouth (row 7) overlays stay aligned; stages differ in hair, hands, body & legs.
// Cheeks (c) are baked into row 6 for cuteness. Rows 5/7 here are placeholders.
const STAGE_MAPS: Record<GrowthStage, string[]> = {
  // newborn — bald wisp, swaddled & tiny
  newborn: [
    '____oooo____',
    '___ohhho____',
    '__osssssso__',
    '_osssssssso_',
    '_osssssssso_',
    '_oscseescso_',
    '_oscsssscso_',
    '_osssmmssso_',
    '_obbbbbbbbo_',
    '_obbbbbbbbo_',
    '_obwwwwwwbo_',
    '_obbbbbbbbo_',
    '__oobbbboo__',
  ],
  // 首すわり — a little hair, tiny hands peeking at the sides
  kubisuwari: [
    '___oooooo___',
    '__ohhhhhho__',
    '_ohhsssshho_',
    '_osshhhhsso_',
    '_osssssssso_',
    '_oscseescso_',
    '_oscsssscso_',
    '_osssmmssso_',
    '_obbbbbbbbo_',
    'sobbbbbbbbos',
    '_obbbbbbbbo_',
    '_obbwwwwbbo_',
    '_obbbbbbbbo_',
  ],
  // おすわり — full hair, sitting, hands on lap
  osuwari: [
    '___oooooo___',
    '__ohhhhhho__',
    '_ohhhhhhhho_',
    '_osshhhhsso_',
    '_osssssssso_',
    '_oscseescso_',
    '_oscsssscso_',
    '_osssmmssso_',
    '_obbbbbbbbo_',
    'obbbbbbbbbbo',
    'osbbbbbbbbso',
    '_obbwwwwbbo_',
    '_obbbbbbbbo_',
  ],
  // つかまり立ち — arms up, legs apart with little feet
  tsukamari: [
    '___oooooo___',
    '__ohhhhhho__',
    '_ohhhhhhhho_',
    '_osshhhhsso_',
    '_osssssssso_',
    '_oscseescso_',
    '_oscsssscso_',
    '_osssmmssso_',
    'sobbbbbbbbos',
    '_obbbbbbbbo_',
    '_obbwwwwbbo_',
    '_obbb__bbbo_',
    '__oo____oo__',
  ],
  // あんよ — fuller hair, arms out for balance, wide walking stride
  ayumi: [
    '__oooooooo__',
    '_ohhhhhhhho_',
    '_ohhhhhhhho_',
    '_osshhhhsso_',
    '_osssssssso_',
    '_oscseescso_',
    '_oscsssscso_',
    '_osssmmssso_',
    'sobbbbbbbbos',
    '_obbbbbbbbo_',
    '_obbwwwwbbo_',
    '_obb____bbo_',
    '_oo______oo_',
  ],
};

/** Build the 13-row grid for a stage with the chosen eyes/mouth overlays. */
export function buildRows(stage: GrowthStage, eyes: string, mouth: string): string[] {
  const r = [...STAGE_MAPS[stage]];
  r[5] = eyes;
  r[7] = mouth;
  return r;
}

/** Convert a char grid to SVG markup string (set via dangerouslySetInnerHTML / innerHTML). */
export function rowsToSvgInner(rows: string[]): { viewBox: string; inner: string } {
  const cols = Math.max(...rows.map((r) => r.length));
  let s = '';
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (C[ch]) s += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${C[ch]}"/>`;
    });
  });
  return { viewBox: `0 0 ${cols} ${rows.length}`, inner: s };
}
