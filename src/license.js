// Lizenzschlüssel (Lemon Squeezy): Eingabe-Formatierung und Prüfung über die öffentliche Lizenz-API.
import { LS_PRODUCT_ID } from './config.js';

const KEY_STORE = 'qr-license';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Bereinigt die Eingabe (Leerzeichen weg, Kleinbuchstaben, max. 36 Zeichen). */
export function formatKey(raw) {
  return raw.trim().toLowerCase().replace(/[^0-9a-f-]/g, '').slice(0, 36);
}

export function isCompleteKey(key) {
  return UUID.test(key);
}

/**
 * Prüft einen Schlüssel bei Lemon Squeezy. Gibt 'ok', 'invalid' oder 'unavailable' zurück.
 * Ohne LS_PRODUCT_ID (noch nicht eingetragen) gilt im Build jeder Schlüssel als nicht prüfbar.
 * Im Entwicklungsmodus schaltet 00000000-0000-4000-8000-000000000000 frei, damit sich das testen lässt.
 */
export async function verifyKey(key) {
  if (import.meta.env.DEV && key === '00000000-0000-4000-8000-000000000000') return 'ok';
  if (!LS_PRODUCT_ID) return 'unavailable';
  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ license_key: key }),
    });
    if (res.status >= 500) return 'unavailable';
    const data = await res.json();
    // Nur Schlüssel unseres eigenen Produkts gelten (Schlüssel anderer Shops sind sonst auch „valid").
    return data.valid && String(data.meta?.product_id) === String(LS_PRODUCT_ID) ? 'ok' : 'invalid';
  } catch {
    return 'unavailable';
  }
}

export function saveKey(key) {
  try { localStorage.setItem(KEY_STORE, key); } catch { /* Speicher nicht verfügbar */ }
}

export function savedKey() {
  try { return localStorage.getItem(KEY_STORE); } catch { return null; }
}
