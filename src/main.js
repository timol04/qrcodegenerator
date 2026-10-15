import './style.css';
import { UPGRADE_URL, PRO_SWATCHES, LONG_TEXT_LIMIT } from './config.js';
import { mountQr, updateQr, setPreviewColor, downloadPng } from './qr.js';
import { formatKey, isCompleteKey, verifyKey } from './license.js';

const $ = (id) => document.getElementById(id);
const input = $('qr-text');
const status = $('status');
const preview = $('preview');
const sticker = $('sticker');
const ribbon = $('ribbon');
const btnPng = $('download-png');
const toast = $('toast');
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// --- Upgrade-Links ---
$('upgrade-top').href = UPGRADE_URL;
$('buy-dialog').href = UPGRADE_URL;

// --- Dark/Light ---
const themeBtn = $('theme-toggle');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : darkQuery.matches);
function syncThemeLabel() {
  themeBtn.setAttribute('aria-label', isDark() ? 'Helles Design einschalten' : 'Dunkles Design einschalten');
}
themeBtn.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('qr-theme', next); } catch { /* Speicher nicht verfügbar */ }
  syncThemeLabel();
});
darkQuery.addEventListener('change', syncThemeLabel);
syncThemeLabel();

// --- QR-Code ---
mountQr(preview);
sticker.classList.add('is-empty');

function describe(text) {
  const n = text.length;
  const count = `${n} Zeichen`;
  if (n > LONG_TEXT_LIMIT) return 'Lang. Der Code wird dicht und schwerer scanbar.';
  if (/^(https?:\/\/)\S+$/i.test(text) || /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(text)) {
    return `Link erkannt · ${count}`;
  }
  if (/^(mailto:)?[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(text)) return `E-Mail erkannt · ${count}`;
  return `Text · ${count}`;
}

let landed = false;
function landSticker() {
  if (landed || reduceMotion.matches) { landed = true; return; }
  landed = true;
  sticker.classList.add('is-landing');
  sticker.addEventListener('animationend', () => sticker.classList.remove('is-landing'), { once: true });
}

// Live-Vorschau: bei jeder Eingabe sofort neu generieren, ohne Animation.
input.addEventListener('input', () => {
  const text = input.value.trim();
  const has = text.length > 0;
  sticker.classList.toggle('is-empty', !has);
  btnPng.disabled = !has;
  status.textContent = has ? describe(text) : ' ';
  if (has) {
    landSticker();
    updateQr(text);
  }
});

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}
btnPng.addEventListener('click', async () => {
  await downloadPng();
  showToast('PNG gespeichert');
});

// --- Pro-Bereich: auf dem Handy zugeklappt, am Desktop offen ---
const proDetails = $('pro');
const wide = matchMedia('(min-width: 900px)');
proDetails.open = wide.matches;
wide.addEventListener('change', (e) => { proDetails.open = e.matches; });

// --- Dialoge ---
const proDialog = $('pro-dialog');
const licenseDialog = $('license-dialog');
function openDialog(d) { if (!d.open) d.showModal(); }
for (const d of [proDialog, licenseDialog]) {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => d.close()));
}
let proActive = false;
document.querySelectorAll('[data-pro-gate]').forEach((el) =>
  el.addEventListener('click', () => { if (!proActive) openDialog(proDialog); })
);
$('have-key').addEventListener('click', () => { proDialog.close(); openLicense(); });
$('open-license').addEventListener('click', openLicense);

const keyInput = $('license-key');
const keyMsg = $('license-msg');
function openLicense() {
  if (proActive) { showToast('Pro ist freigeschaltet.'); return; }
  keyMsg.textContent = ' ';
  keyMsg.classList.remove('is-error');
  openDialog(licenseDialog);
  keyInput.focus();
}
keyInput.addEventListener('input', () => {
  keyInput.value = formatKey(keyInput.value);
  keyMsg.textContent = ' ';
  keyMsg.classList.remove('is-error');
});
$('license-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = keyInput.value;
  const fail = (msg) => { keyMsg.textContent = msg; keyMsg.classList.add('is-error'); };
  if (!isCompleteKey(key)) return fail('Dieser Schlüssel passt nicht. Prüfe ihn in deiner Gumroad-Mail.');
  const result = await verifyKey(key);
  if (result === 'ok') { licenseDialog.close(); unlockPro(); }
  else if (result === 'unavailable') fail('Die Schlüsselprüfung ist noch nicht aktiv.');
  else fail('Dieser Schlüssel passt nicht. Prüfe ihn in deiner Gumroad-Mail.');
});

// --- Farbtupfer: Pro-Vorschau auf dem Sticker (Download bleibt schwarz-weiss) ---
const swatchBox = $('swatches');
let activeSwatch = null;
swatchBox.innerHTML = PRO_SWATCHES.map(
  (s) => `<button type="button" class="swatch" style="--swatch:${s.color}" data-color="${s.color}" aria-pressed="false" aria-label="${s.name} (Vorschau)"></button>`
).join('');
swatchBox.addEventListener('click', (e) => {
  const btn = e.target.closest('.swatch');
  if (!btn) return;
  const same = activeSwatch === btn;
  swatchBox.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  activeSwatch = same ? null : btn;
  if (activeSwatch) activeSwatch.setAttribute('aria-pressed', 'true');
  setPreviewColor(activeSwatch ? activeSwatch.dataset.color : null);
  ribbon.hidden = !activeSwatch || proActive;
});

// --- Freischalten: Schlösser öffnen sich nacheinander ---
function unlockPro() {
  proActive = true;
  ribbon.hidden = true;
  setPreviewColor(null);
  swatchBox.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  activeSwatch = null;
  const rows = [...document.querySelectorAll('.pro-row')];
  rows.forEach((row, i) => {
    row.style.setProperty('--unlock-delay', `${i * 220}ms`);
    row.classList.add('is-unlocking');
  });
  const delay = reduceMotion.matches ? 0 : rows.length * 220;
  setTimeout(() => {
    rows.forEach((row) => { row.removeAttribute('data-locked'); row.removeAttribute('data-tip'); });
    const label = $('upgrade-top');
    label.removeAttribute('href');
    label.classList.add('is-active');
    label.querySelector('.pro-label-full').textContent = 'Pro aktiv';
    label.querySelector('.pro-label-short').textContent = 'Pro aktiv';
    showToast('Pro ist freigeschaltet.');
  }, delay);
}
