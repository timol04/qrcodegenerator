# QR Code Generator Pro

Client-seitige Web-App (Vite + Vanilla JS, kein Backend) zum Erstellen von QR-Codes.
Verwendet [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling).

## Lokal starten

```bash
npm install
npm run dev      # http://localhost:5173
```

## Für Deployment bauen

```bash
npm run build    # Ausgabe in dist/ – statisch hostbar (GitHub Pages, Netlify, Vercel)
npm run preview  # gebautes Ergebnis lokal testen
```

## Struktur

| Datei | Zweck |
|---|---|
| `index.html` | Seitengerüst |
| `src/config.js` | Upgrade-Link und Produkt-ID (Lemon Squeezy), QR-Grösse, Farbtupfer der Pro-Vorschau |
| `src/qr.js` | QR-Erzeugung und Export (PNG, SVG, PDF) |
| `src/content.js` | Erkennt Link/E-Mail/Text, ergänzt https:// und mailto:, Dateinamen |
| `src/sticker.js` | Sticker-Studio: Form, Beschriftung, SVG-Komposition, Scan-Test mit echtem Decoder |
| `src/batch.js` | CSV einlesen und ZIP mit vielen Codes erzeugen |
| `src/main.js` | UI-Logik (Live-Vorschau, Dialoge, Dark Mode, Pro-Vorschau) |
| `src/license.js` | Schlüssel-Formatierung; Prüfung über die Lemon-Squeezy-Lizenz-API (braucht `LS_PRODUCT_ID`) |
| `src/i18n.js` | Sprachen Englisch (Standard), Deutsch, Spanisch (Texte, Umschalter, gespeicherte Wahl) |
| `src/style.css` | Styling (responsive) |

## Stand

- Gratis-Version: Text/URL → Live-Vorschau, schwarz auf weiss, PNG-Export.
- Sticker-Studio: Form (Quadrat, Abgerundet, Rund), Beschriftung, Scan-Test und druckfertiger A4-Stickerbogen mit Schnittlinien.
- Punktform (Weich, Rund, Elegant, Eckig), Farben und Farbverläufe, Logo als Form (Punkte bilden das Logo, mit Scan-Test) oder in der Mitte, Logo in der Mitte, PNG gross, SVG, PDF und CSV → ZIP funktionieren (vorerst frei, siehe unten).
- Design nach Design-Brief (Schneidematte, Sticker, Hell/Dunkel). Lizenz-Fenster und Freischalt-Animation sind gestaltet; im Dev-Modus schaltet `00000000-0000-4000-8000-000000000000` frei.

**Vor dem Release:** In `src/config.js` den Platzhalter `UPGRADE_URL` und `LS_PRODUCT_ID` durch die echten Lemon-Squeezy-Werte ersetzen.

**Gestalten-Funktionen (Farben, Logo, PNG gross/SVG/PDF, CSV → ZIP):** Mit `PRO_REQUIRED = false` in `src/config.js` sind sie für alle frei nutzbar, ohne Schloss und Kaufhinweise. Mit `true` sind sie gesperrt (Farben nur als Vorschau, Rest öffnet den Pro-Hinweis; die Lizenzprüfung ist noch nicht echt).
