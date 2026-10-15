import QRCodeStyling from 'qr-code-styling';
import { QR_SIZE } from './config.js';

// Gratis-Stil: schwarz auf weiss, feste Grösse.
// Premium-Optionen (Logo, Farben, Verlauf) werden später hier ergänzt –
// qr-code-styling unterstützt sie bereits über dieselbe Options-Struktur.
const baseOptions = {
  width: QR_SIZE,
  height: QR_SIZE,
  margin: 8,
  qrOptions: { errorCorrectionLevel: 'M' },
  dotsOptions: { color: '#000000', type: 'square' },
  backgroundOptions: { color: '#ffffff' },
};

const qr = new QRCodeStyling({ ...baseOptions, data: ' ' });

/** Hängt die Vorschau in das übergebene Element ein. */
export function mountQr(el) {
  qr.append(el);
}

/** Aktualisiert den QR-Code (live bei jeder Eingabe). */
export function updateQr(text) {
  qr.update({ data: text });
}

/** Lädt den aktuellen Code als PNG herunter. */
export function downloadPng(name = 'qr-code') {
  return qr.download({ name, extension: 'png' });
}
