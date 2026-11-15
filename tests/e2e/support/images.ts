import { deflateSync } from "node:zlib";

// Imagens de teste geradas em memória (PNG), sem ficheiros no repositório.
const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const crc32 = (buffer: Buffer): number => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Buffer): Buffer => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
};

const png = (width: number, height: number, colorType: 2 | 6, pixels: Buffer): Buffer => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels, { level: 1 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

/** Uma foto "pesada": ruído (o PNG fica com vários MB), para exercitar a compressão. */
export function noisyPhoto(width = 1600, height = 1200): Buffer {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    for (let i = 0; i < width * 3; i++) raw[y * stride + 1 + i] = (Math.random() * 256) | 0;
  }
  return png(width, height, 2, raw);
}

/** Um PNG totalmente transparente (o JPEG não tem transparência: tem de ficar com fundo branco). */
export function transparentPng(width = 600, height = 400): Buffer {
  return png(width, height, 6, Buffer.alloc((width * 4 + 1) * height));
}
