// Zentrale Einstellungen – hier anpassen, ohne den Rest des Codes anzufassen.

// TODO: durch den echten Lemon-Squeezy-Checkout-Link ersetzen.
export const UPGRADE_URL = 'https://DEIN-SHOP.lemonsqueezy.com/buy/DEIN-PRODUKT';

// TODO: Produkt-ID aus Lemon Squeezy eintragen (Zahl). Solange leer, ist die Schlüsselprüfung aus.
export const LS_PRODUCT_ID = '';

// Grösse des Gratis-QR-Codes in Pixeln (reicht für ca. 8 cm Druck bei 300 dpi).
export const QR_SIZE = 1000;
// „PNG gross" (z. B. für Plakate).
export const QR_SIZE_LARGE = 3000;

// Farbtupfer im Pro-Bereich. Muss dunkel genug bleiben, damit der Code scanbar ist.
export const PRO_SWATCHES = [
  { name: 'Schwarz', color: '#000000' },
  { name: 'Tannengrün', color: '#1F5C46' },
  { name: 'Tiefblau', color: '#1B4F9C' },
  { name: 'Backsteinrot', color: '#A8321E' },
  { name: 'Aubergine', color: '#5B2A4E' },
  // Verläufe über alle Punkte: zwei Farben, beide dunkel genug zum Scannen
  { name: 'Wald bis Ozean', color: ['#1E7A4C', '#1B4F9C'] },
  { name: 'Ozean', color: ['#0B7BA8', '#1B3A8C'] },
  { name: 'Abendrot', color: ['#C2410C', '#7B2A85'] },
  { name: 'Beere', color: ['#B0286B', '#4B2A8C'] },
];

// Ab dieser Länge erscheint der Hinweis, dass der Code dicht wird.
export const LONG_TEXT_LIMIT = 250;

// Müssen die Gestalten-Funktionen (Farben, Logo, SVG/PDF, CSV) gekauft werden?
// false = vorerst für alle frei nutzbar, ohne Schloss, Kauf- und Lizenz-Hinweise.
// true = gesperrt: Farben nur als Vorschau, übrige Funktionen öffnen den Pro-Hinweis.
export const PRO_REQUIRED = false;
