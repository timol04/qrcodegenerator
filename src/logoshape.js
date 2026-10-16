// Logo-Form: Die Punkte des QR-Codes bilden die Form des Logos, in der Logo-Farbe.
// Innerhalb der Form liegt das (abgedunkelte) Logo als Hintergrund, dunkle Module sind
// schwarze, helle Module weisse Punkte. Ausserhalb bleibt der Code schwarz auf Weiss.
import { qrcode } from 'qrcode-generator';

const imageCache = new Map();
function loadImage(url) {
  if (!imageCache.has(url)) {
    imageCache.set(url, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    }));
  }
  return imageCache.get(url);
}

const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const QUIET = 3; // Ruhezone in Modulen
const MAX_BG_LUM = 0.2; // Hintergrund der Form darf nicht heller sein, sonst fehlt der Kontrast
const FINDER = 7;
const DARK_IN = 0.42;
const LIGHT_IN = 0.5; 
const DOT_OUT = 0.42;

function buildMatrix(data) {
  // UTF-8-Bytes als Latin-1-Zeichenkette, damit auch Umlaute korrekt kodiert werden
  const bin = String.fromCharCode(...new TextEncoder().encode(data));
  for (const level of ['Q', 'M', 'L']) {
    try {
      const qr = qrcode(0, level);
      qr.addData(bin, 'Byte');
      qr.make();
      return qr;
    } catch { /* zu viele Daten für diese Stufe, nächste versuchen */ }
  }
  throw new Error('too long');
}

/** Zeichnet den Code mit Logo-Form auf ein Quadrat der Kantenlänge size. */
export async function shapeCodeCanvas(data, size, logoUrl, darkColor = '#000000') {
  const img = await loadImage(logoUrl);
  const qr = buildMatrix(data);
  const n = qr.getModuleCount();
  const m = size / (n + 2 * QUIET);
  const origin = QUIET * m;
  const area = n * m;

  // Logo einpassen (contain) und nahezu weisse Pixel freistellen
  const scale = Math.min(area / img.naturalWidth, area / img.naturalHeight);
  const lw = Math.max(1, Math.round(img.naturalWidth * scale));
  const lh = Math.max(1, Math.round(img.naturalHeight * scale));
  const lx = origin + (area - lw) / 2;
  const ly = origin + (area - lh) / 2;
  const logo = document.createElement('canvas');
  logo.width = lw;
  logo.height = lh;
  const lctx = logo.getContext('2d', { willReadFrequently: true });
  lctx.drawImage(img, 0, 0, lw, lh);
  const px = lctx.getImageData(0, 0, lw, lh);
  let maxLum = 0;
  for (let i = 0; i < px.data.length; i += 4) {
    const l = lum(px.data[i], px.data[i + 1], px.data[i + 2]);
    if (px.data[i + 3] < 128 || l > 0.92) px.data[i + 3] = 0;
    else if (l > maxLum) maxLum = l;
  }
  lctx.putImageData(px, 0, 0);
  const darken = maxLum > MAX_BG_LUM ? MAX_BG_LUM / maxLum : 1;

  // Pro Modul: liegt es in der Logo-Form? Dazu Durchschnittsfarbe für die Eck-Markierungen.
  const mask = document.createElement('canvas');
  mask.width = n;
  mask.height = n;
  const mctx = mask.getContext('2d', { willReadFrequently: true });
  mctx.drawImage(logo, (lx - origin) / m, (ly - origin) / m, lw / m, lh / m);
  const md = mctx.getImageData(0, 0, n, n).data;
  const inside = (r, c) => md[(r * n + c) * 4 + 3] > 140;
  let sr = 0, sg = 0, sb = 0, count = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!inside(r, c)) continue;
    const i = (r * n + c) * 4;
    sr += md[i]; sg += md[i + 1]; sb += md[i + 2]; count++;
  }
  let accent = [0, 0, 0];
  if (count) {
    accent = [sr / count, sg / count, sb / count];
    const f = Math.min(1, 0.32 / Math.max(lum(...accent), 0.001));
    accent = accent.map((v) => v * f);
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.filter = `brightness(${darken})`;
  ctx.drawImage(logo, lx, ly, lw, lh);
  ctx.restore();

  const inFinder = (r, c) =>
    (r < FINDER + 1 && c < FINDER + 1) || (r < FINDER + 1 && c >= n - FINDER - 1) || (r >= n - FINDER - 1 && c < FINDER + 1);
  const dot = (r, c, radius, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(origin + (c + 0.5) * m, origin + (r + 0.5) * m, radius * m, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (inFinder(r, c)) continue;
      const inLogo = inside(r, c);
      if (qr.isDark(r, c)) dot(r, c, inLogo ? DARK_IN : DOT_OUT, darkColor);
      else if (inLogo) dot(r, c, LIGHT_IN, '#ffffff');
    }
  }

  // Eck-Markierungen samt weissem Rand freihalten, das Logo darf nicht hineinragen
  ctx.fillStyle = '#ffffff';
  const pad = (FINDER + 1) * m;
  ctx.fillRect(origin - m, origin - m, pad + m, pad + m);
  ctx.fillRect(origin + area - pad, origin - m, pad + m, pad + m);
  ctx.fillRect(origin - m, origin + area - pad, pad + m, pad + m);

  // Eck-Markierungen: schwarzer Ring, weisser Rand, Mitte in der Logo-Farbe
  const eye = (r0, c0) => {
    const x = origin + c0 * m;
    const y = origin + r0 * m;
    ctx.fillStyle = darkColor;
    ctx.fillRect(x, y, FINDER * m, FINDER * m);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + m, y + m, (FINDER - 2) * m, (FINDER - 2) * m);
    ctx.fillStyle = `rgb(${accent.map(Math.round).join(',')})`;
    ctx.fillRect(x + 2 * m, y + 2 * m, (FINDER - 4) * m, (FINDER - 4) * m);
  };
  eye(0, 0);
  eye(0, n - FINDER);
  eye(n - FINDER, 0);
  return canvas;
}
