/**
 * Floyd-Steinberg dithering + EPD image-encoding utilities.
 * Produces byte arrays ready for NFC transmission to Goodisplay e-ink screens.
 */

// ─── Floyd-Steinberg Dithering ───────────────────────────────────────────────

/**
 * Convert an ImageData (RGBA) to a dithered 1-bit (BW) ImageData.
 * Returns a new ImageData where every pixel is either 0 (black) or 255 (white).
 */
export function floydSteinbergDither(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  // Convert to greyscale float array
  const grey = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    grey[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const old = grey[idx];
      const newVal = old < 128 ? 0 : 255;
      grey[idx] = newVal;
      const err = old - newVal;

      const distribute = (dx: number, dy: number, factor: number) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          grey[ny * width + nx] += err * factor;
        }
      };
      distribute(1, 0, 7 / 16);
      distribute(-1, 1, 3 / 16);
      distribute(0, 1, 5 / 16);
      distribute(1, 1, 1 / 16);
    }
  }

  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const v = grey[i] < 128 ? 0 : 255;
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

// ─── EPD Vertical-Scan Encoding ──────────────────────────────────────────────

/**
 * Encode a dithered ImageData into SSD-series EPD byte format.
 * The image must already be rotated 90° for portrait panels (width < height).
 *
 * mode 0 = Black/White channel: black pixel → bit 0, white → bit 1
 * mode 1 = Red/White channel:   red pixel  → bit 0, white → bit 1
 */
export function encodeSSD(imageData: ImageData, mode: 0 | 1): Uint8Array {
  const { width, height, data } = imageData;
  const buf = new Uint8Array((width * height) / 8);
  let index = 0;

  for (let x = width - 1; x >= 0; x--) {
    for (let j = 0; j <= Math.floor(height / 8) - 1; j++) {
      let byte = 0;
      for (let k = 0; k < 8; k++) {
        byte = (byte * 2) & 0xff;
        const px = (j * 8 + k) * width + x;
        const r = data[px * 4];
        const g = data[px * 4 + 1];
        const b = data[px * 4 + 2];

        if (mode === 0) {
          // BW: white pixel → 1
          if (!(r <= 100 && g <= 100 && b <= 100)) byte |= 1;
        } else {
          // RW: red pixel → 0 (bit stays 0), white → 1
          if (!(r >= 100 && g <= 100 && b <= 100)) byte |= 1;
        }
      }
      buf[index++] = byte;
    }
  }
  return buf;
}

/**
 * Encode a 4-colour ImageData into 2-bits-per-pixel format (4G).
 * 00=black, 01=white, 02=yellow, 03=red
 */
export function encode4G(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData;
  const buf = new Uint8Array((width * height) / 4);
  let index = 0;

  for (let x = width - 1; x >= 0; x--) {
    for (let j = 0; j <= Math.floor(height / 4) - 1; j++) {
      let byte = 0;
      for (let k = 0; k < 4; k++) {
        byte = (byte * 4) & 0xff;
        const px = (j * 4 + k) * width + x;
        const r = data[px * 4];
        const g = data[px * 4 + 1];
        const b = data[px * 4 + 2];

        if (r <= 100 && g <= 100 && b <= 100) {
          byte |= 0x00; // black
        } else if (r >= 200 && g >= 200 && b >= 200) {
          byte |= 0x01; // white
        } else {
          const avg = (r + g + b) / 3;
          byte |= avg <= 127 ? 0x03 : 0x02; // red : yellow
        }
      }
      buf[index++] = byte;
    }
  }
  return buf;
}

// ─── Canvas helpers ──────────────────────────────────────────────────────────

export function rotateImageData(src: ImageData, degrees: 90 | -90): ImageData {
  const sw = src.width;
  const sh = src.height;
  const dst = new ImageData(sh, sw);

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const srcIdx = (y * sw + x) * 4;
      let dstIdx: number;
      if (degrees === 90) {
        dstIdx = ((x) * sh + (sh - 1 - y)) * 4;
      } else {
        dstIdx = ((sw - 1 - x) * sh + y) * 4;
      }
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
  return dst;
}

/**
 * Render an HTML canvas to the correct EPD byte arrays for NFC transmission.
 * Returns { bwData, rwData } — rwData is null for 2-colour BW-only screens.
 */
export function renderCanvasToEpdBytes(
  canvas: HTMLCanvasElement,
  epdColor: 2 | 3 | 4,
  epdWidth: number,
  epdHeight: number
): { bwData: number[]; rwData: number[] | null } {
  // 1. Scale canvas content to exact EPD dimensions
  const tmp = document.createElement('canvas');
  tmp.width = epdWidth;
  tmp.height = epdHeight;
  const ctx = tmp.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0, epdWidth, epdHeight);
  let imgData = ctx.getImageData(0, 0, epdWidth, epdHeight);

  // 2. Dither for BW-based screens
  if (epdColor === 2 || epdColor === 3) {
    imgData = floydSteinbergDither(imgData);
  }

  // 3. For panels < 4.2", rotate 90° before vertical scan
  const needsRotation = epdWidth < epdHeight;
  const rotated = needsRotation ? rotateImageData(imgData, 90) : imgData;

  if (epdColor === 4) {
    const bwData = Array.from(encode4G(rotated));
    return { bwData, rwData: null };
  }

  const bwData = Array.from(encodeSSD(rotated, 0));
  const rwData = epdColor === 3 ? Array.from(encodeSSD(rotated, 1)) : null;
  return { bwData, rwData };
}
