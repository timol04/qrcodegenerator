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
| `src/config.js` | Upgrade-Link (Gumroad), QR-Grösse, Farbtupfer der Pro-Vorschau |
| `src/qr.js` | QR-Erzeugung und PNG-Export (hier kommen später Logo/Farben/SVG dazu) |
| `src/main.js` | UI-Logik (Live-Vorschau, Dialoge, Dark Mode, Pro-Vorschau) |
| `src/license.js` | Schlüssel-Formatierung; die Prüfung ist noch nicht aktiv (TODO Gumroad-API) |
| `src/style.css` | Styling (responsive) |

## Stand

- Gratis-Version: Text/URL → Live-Vorschau, schwarz auf weiss, PNG-Export.
- Premium-Funktionen (Logo, Farben, SVG/PDF, Batch) sind als gesperrte Elemente sichtbar, aber noch ohne Funktion.
- Design nach Design-Brief (Schneidematte, Sticker, Hell/Dunkel). Lizenz-Fenster und Freischalt-Animation sind gestaltet; im Dev-Modus schaltet `AAAA-AAAA-AAAA-AAAA` frei, im Build gibt es noch keine echte Prüfung.

**Vor dem Release:** In `src/config.js` den Platzhalter `UPGRADE_URL` durch den echten Gumroad-Link ersetzen.

**Pro ausgeblendet:** Mit `PRO_ENABLED = false` in `src/config.js` sind Pro-Bereich, Lizenz und Upgrade-Button versteckt (Gratis-Start). Auf `true` setzen, um sie wieder zu zeigen.
