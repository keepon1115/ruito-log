// Generates PNG app icons from the sprite pixel map — no external deps.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const C = { o: '#6b4a52', h: '#9a6a4e', s: '#FCE0C9', c: '#F49AC1', e: '#50424A', m: '#E86F9E', b: '#5BC8C4', w: '#C9F0EE' };
const ROWS = [
  '___oooooo___', '__ohhhhhho__', '_ohhhhhhhho_', '_osshhhhsso_', '_osssssssso_',
  '_oscseescso_', '_osssssssso_', '_osssmmssso_', '_obbbbbbbbo_', 'obbbbbbbbbbo',
  'osbbbbbbbbso', '_obbwwwwbbo_', '_obbbbbbbbo_',
];
const BG = [251, 243, 230]; // cream

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function makePng(size, maskable) {
  const grid = 12; // map is 12 wide x 13 tall; pad to square 13x13 centered
  const cols = 12, rowsN = 13;
  const cell = Math.floor((size * (maskable ? 0.62 : 0.74)) / Math.max(cols, rowsN));
  const artW = cell * cols, artH = cell * rowsN;
  const offX = Math.floor((size - artW) / 2), offY = Math.floor((size - artH) / 2);

  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const p = y * (size * 3 + 1) + 1 + x * 3;
      let col = BG;
      const gx = Math.floor((x - offX) / cell);
      const gy = Math.floor((y - offY) / cell);
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rowsN) {
        const ch = ROWS[gy][gx];
        if (C[ch]) col = hex(C[ch]);
      }
      raw[p] = col[0]; raw[p + 1] = col[1]; raw[p + 2] = col[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['apple-touch-icon.png', 180, false],
  ['maskable-512.png', 512, true],
];
for (const [name, size, maskable] of targets) {
  writeFileSync(join(OUT, name), makePng(size, maskable));
  console.log('wrote', name, size);
}
