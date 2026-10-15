import QRCodeStyling from 'qr-code-styling';
import { QR_SIZE } from './config.js';

// Gratis-Stil: schwarz auf weiss, feste Grösse.
const baseOptions = {
  width: QR_SIZE,
  height: QR_SIZE,
  margin: 8,
  qrOptions: { errorCorrectionLevel: 'M' },
  dotsOptions: { color: '#000000', type: 'square' },
  backgroundOptions: { color: '#ffffff' },
};

// Vorschau (darf für die Pro-Vorschau eingefärbt werden) ...
const qr = new QRCodeStyling({ ...baseOptions, data: ' ' });
// ... und Export-Instanz, die immer schwarz auf weiss bleibt.
const exportQr = new QRCodeStyling({ ...baseOptions, data: ' ' });

/** Hängt die Vorschau in das übergebene Element ein. */
export function mountQr(el) {
  qr.append(el);
}

/** Aktualisiert den QR-Code (live bei jeder Eingabe). */
export function updateQr(text) {
  qr.update({ data: text });
  exportQr.update({ data: text });
}

/** Färbt nur die Vorschau ein (Pro-Vorschau); null = zurück zu Schwarz. */
export function setPreviewColor(color) {
  qr.update({ dotsOptions: { color: color || '#000000' } });
}

/** Lädt den aktuellen Code als PNG herunter (immer schwarz auf weiss). */
export function downloadPng(name = 'qr-code') {
  return exportQr.download({ name, extension: 'png' });
}
