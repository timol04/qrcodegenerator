// Lizenzschlüssel: Eingabe-Formatierung und (noch nicht aktive) Prüfung.

/** Gliedert die Eingabe in Blöcke: ABCD-EFGH-IJKL-MNOP. */
export function formatKey(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  return clean.match(/.{1,4}/g)?.join('-') ?? '';
}

export function isCompleteKey(key) {
  return /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(key);
}

/**
 * Prüft einen Schlüssel. Gibt 'ok', 'invalid' oder 'unavailable' zurück.
 * TODO: gegen die Gumroad-Lizenz-API prüfen. Bis dahin ist die Prüfung nicht aktiv;
 * nur im Entwicklungsmodus gilt AAAA-AAAA-AAAA-AAAA als gültig, damit sich das Freischalten testen lässt.
 */
export async function verifyKey(key) {
  if (import.meta.env.DEV) return key === 'AAAA-AAAA-AAAA-AAAA' ? 'ok' : 'invalid';
  return 'unavailable';
}
