// Erkennt, was eingegeben wurde, und bereitet den Inhalt für den QR-Code auf.

// Maximale Datenmenge eines QR-Codes (Version 40, Fehlerkorrektur M, Byte-Modus).
export const MAX_BYTES = 2331;

const URL_WITH_SCHEME = /^https?:\/\/\S+$/i;
const BARE_DOMAIN = /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i;
const EMAIL = /^(mailto:)?[^\s@/]+@[^\s@/]+\.[a-z]{2,}$/i;

/**
 * Liefert { kind, data, bytes }:
 * kind: 'link' | 'email' | 'text'
 * data: der Inhalt, der in den Code kommt (Link mit https://, E-Mail mit mailto:)
 */
export function analyze(text) {
  let kind = 'text';
  let data = text;
  if (URL_WITH_SCHEME.test(text)) kind = 'link';
  else if (EMAIL.test(text)) {
    kind = 'email';
    if (!/^mailto:/i.test(text)) data = `mailto:${text}`;
  } else if (BARE_DOMAIN.test(text)) {
    kind = 'link';
    data = `https://${text}`;
  }
  return { kind, data, bytes: new TextEncoder().encode(data).length };
}

/** Dateiname aus dem Inhalt, z. B. qr-dein-laden-ch.png für https://www.dein-laden.ch/menu */
export function fileName({ kind, data }) {
  let base = '';
  if (kind === 'link') {
    try { base = new URL(data).hostname.replace(/^www\./, ''); } catch { /* ungültige URL */ }
  } else if (kind === 'email') {
    base = data.replace(/^mailto:/i, '').split('@')[1] ?? '';
  }
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return slug ? `qr-${slug}` : 'qr-code';
}
