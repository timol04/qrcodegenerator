// Zentrale Einstellungen – hier anpassen, ohne den Rest des Codes anzufassen.

// TODO: durch den echten Gumroad-Produktlink ersetzen.
export const UPGRADE_URL = 'https://gumroad.com/l/DEIN-PRODUKT';

// Grösse des Gratis-QR-Codes in Pixeln (reicht für ca. 8 cm Druck bei 300 dpi).
export const QR_SIZE = 1000;

// Farbtupfer im Pro-Bereich. Nur Vorschau auf dem Sticker, der Download bleibt schwarz-weiss.
export const PRO_SWATCHES = [
  { name: 'Tannengrün', color: '#1F5C46' },
  { name: 'Tiefblau', color: '#1B4F9C' },
  { name: 'Backsteinrot', color: '#A8321E' },
  { name: 'Aubergine', color: '#5B2A4E' },
];

// Ab dieser Länge erscheint der Hinweis, dass der Code dicht wird.
export const LONG_TEXT_LIMIT = 250;

// Pro-Bereich, Lizenz und Upgrade-Button anzeigen? Vorerst aus (reine Gratis-Version).
export const PRO_ENABLED = false;
