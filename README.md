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
| `src/config.js` | Upgrade-Link (Gumroad), QR-Grösse, Liste der Premium-Funktionen |
| `src/qr.js` | QR-Erzeugung und PNG-Export (hier kommen später Logo/Farben/SVG dazu) |
| `src/main.js` | UI-Logik (Live-Vorschau, Buttons) |
| `src/style.css` | Styling (responsive) |

## Stand

- Gratis-Version: Text/URL → Live-Vorschau, schwarz auf weiss, PNG-Export.
- Premium-Funktionen (Logo, Farben, SVG/PDF, Batch) sind als gesperrte Elemente sichtbar, aber noch ohne Funktion.
- Lizenzschlüssel-Gate: noch nicht umgesetzt.

**Vor dem Release:** In `src/config.js` den Platzhalter `UPGRADE_URL` durch den echten Gumroad-Link ersetzen.
