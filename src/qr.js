import QRCodeStyling from 'qr-code-styling';
import { QR_SIZE, QR_SIZE_LARGE } from './config.js';

export const FORMATS = {
  png: { label: 'PNG', ext: 'png', size: QR_SIZE, caption: `${QR_SIZE} × ${QR_SIZE} px · PNG` },
  'png-large': { label: 'PNG gross', ext: 'png', size: QR_SIZE_LARGE, caption: `${QR_SIZE_LARGE} × ${QR_SIZE_LARGE} px · PNG` },
  svg: { label: 'SVG', ext: 'svg', size: QR_SIZE, caption: 'SVG · beliebig skalierbar' },
  pdf: { label: 'PDF', ext: 'pdf', size: QR_SIZE_LARGE, caption: 'PDF · A4, Code 12 cm' },
};

/** Stil eines Codes: Farbe der Module und optionales Logo (Data-URL). */
function options({ data, size, color = '#000000', logo = null }) {
  return {
    width: size,
    height: size,
    margin: Math.round(size * 0.027),
    data,
    // Mit Logo in der Mitte braucht der Code mehr Fehlerkorrektur, damit er scanbar bleibt.
    qrOptions: { errorCorrectionLevel: logo ? 'H' : 'M' },
    dotsOptions: { color, type: 'square' },
    cornersSquareOptions: { color, type: 'square' },
    cornersDotOptions: { color, type: 'square' },
    backgroundOptions: { color: '#ffffff' },
    image: logo || undefined,
    imageOptions: { hideBackgroundDots: true, imageSize: 0.26, margin: Math.round(size * 0.01), crossOrigin: 'anonymous' },
  };
}

const qr = new QRCodeStyling(options({ data: ' ', size: QR_SIZE }));

/** Hängt die Vorschau in das übergebene Element ein. */
export function mountQr(el) {
  qr.append(el);
}

/** Aktualisiert die Vorschau (live bei jeder Eingabe oder Stiländerung). */
export function updateQr(data, style = {}) {
  qr.update(options({ data, size: QR_SIZE, ...style }));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Erzeugt die Datei (Blob) für einen Inhalt im gewählten Format. */
export async function renderBlob(data, format, style = {}) {
  const { size } = FORMATS[format];
  const code = new QRCodeStyling(options({ data, size, ...style }));
  if (format === 'svg') return code.getRawData('svg');
  const png = await code.getRawData('png');
  if (format !== 'pdf') return png;
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  pdf.addImage(await blobToDataUrl(png), 'PNG', 45, 40, 120, 120);
  return pdf.output('blob');
}

/** Speichert einen Blob als Datei im Browser. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
