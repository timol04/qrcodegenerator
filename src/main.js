import './style.css';
import { UPGRADE_URL, PREMIUM_FEATURES } from './config.js';
import { mountQr, updateQr, downloadPng } from './qr.js';

const $ = (id) => document.getElementById(id);
const input = $('qr-text');
const preview = $('preview');
const hint = $('hint');
const btnPng = $('download-png');

// --- Upgrade-Link(s) ---
$('upgrade-top').href = UPGRADE_URL;

// --- Gesperrte Premium-Funktionen (ohne Funktion, nur Vorschau) ---
$('premium-list').innerHTML = PREMIUM_FEATURES.map(
  (f) => `<li class="premium-item" aria-disabled="true" title="Nur in der Pro-Version">
    <span class="lock" aria-hidden="true">🔒</span> ${f.label}
  </li>`
).join('');

// --- QR-Code ---
mountQr(preview);
preview.classList.add('is-empty');

// Live-Vorschau: bei jeder Eingabe neu generieren.
input.addEventListener('input', () => {
  const text = input.value.trim();
  const has = text.length > 0;
  preview.classList.toggle('is-empty', !has);
  hint.hidden = has;
  btnPng.disabled = !has;
  if (has) updateQr(text);
});

btnPng.addEventListener('click', () => downloadPng());
