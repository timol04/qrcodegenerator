import './style.css';
import '@fontsource/schibsted-grotesk/latin-400.css';
import '@fontsource/schibsted-grotesk/latin-500.css';
import '@fontsource/schibsted-grotesk/latin-600.css';
import '@fontsource/schibsted-grotesk/latin-700.css';
import { UPGRADE_URL, PRO_SWATCHES, LONG_TEXT_LIMIT, PRO_REQUIRED } from './config.js';
import { renderBlob, saveBlob, sheetInfo, FORMATS } from './qr.js';
import { composeCanvas, scanTest, geometry, SCAN_TEXT } from './sticker.js';
import { buildZip } from './batch.js';
import { formatKey, isCompleteKey, verifyKey } from './license.js';
import { analyze, fileName, MAX_BYTES } from './content.js';

const $ = (id) => document.getElementById(id);
const input = $('qr-text');
const status = $('status');
const preview = $('preview');
const sticker = $('sticker');
const ribbon = $('ribbon');
const btnPng = $('download-png');
const toast = $('toast');
const root = document.documentElement;
const emptyNote = $('empty-note');
const EMPTY_TEXT = emptyNote.textContent;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// --- Gratis-Modus (config.js): alles frei nutzbar, ohne Schloss und Kaufhinweise ---
root.dataset.pro = PRO_REQUIRED ? 'locked' : 'free';
let proActive = !PRO_REQUIRED;
if (!PRO_REQUIRED) {
  $('pro-title').textContent = 'Gestalten';
  document.querySelectorAll('.pro-row').forEach((row) => row.removeAttribute('data-locked'));
}

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

// --- Stil und Format (Farbe, Logo, Form, Beschriftung, Dateiformat) ---
const style = { color: '#000000', logo: null, dots: 'dots', shape: 'square', label: '', sheetMm: 40 };
let format = 'png';
let current = null; // { kind, data, bytes } oder null, wenn nichts (Gültiges) eingegeben ist
// Bei gesperrtem Pro gilt für Export nur der Gratis-Stil; Farbe und Vorschau sind dann reine Vorschau.
const exportStyle = () => (proActive ? { ...style } : {});

const PREVIEW_W = 560;
const scanEl = $('scan');
let renderId = 0;
let scanTimer;

function captionText() {
  const f = FORMATS[format];
  if (format === 'sheet') {
    const { count } = sheetInfo(style.sheetMm, exportStyle());
    return `A4 · ${count} Sticker à ${style.sheetMm / 10} cm, mit Schnittlinien`;
  }
  if (format === 'png' || format === 'png-large') {
    const h = Math.round(f.size * geometry(exportStyle().shape, exportStyle().label).h);
    return `${f.size} × ${h} px · PNG`;
  }
  return f.caption;
}

async function refresh() {
  btnPng.textContent = `${FORMATS[format].label} herunterladen`;
  $('mat-caption').textContent = captionText();
  $('sheet-count').textContent = format === 'sheet' ? `${sheetInfo(style.sheetMm, exportStyle()).count} pro Seite` : '';
  const id = ++renderId;
  clearTimeout(scanTimer);
  if (!current) return;
  const canvas = await composeCanvas(current.data, PREVIEW_W, style);
  if (id !== renderId) return;
  preview.replaceChildren(canvas);
  sticker.classList.remove('is-empty');
  landSticker();
  // Scan-Test mit kurzer Verzögerung, damit das Tippen nicht ruckelt
  scanTimer = setTimeout(async () => {
    const level = await scanTest(canvas, current.data);
    if (id !== renderId) return;
    scanEl.hidden = false;
    scanEl.dataset.level = level;
    scanEl.textContent = SCAN_TEXT[level];
  }, 150);
}

// --- QR-Code ---
sticker.classList.add('is-empty');

const KIND_LABEL = { link: 'Link erkannt', email: 'E-Mail erkannt', text: 'Text' };

function describe(info, text) {
  if (info.bytes > MAX_BYTES) return 'Zu lang für einen QR-Code. Kürze den Text etwas.';
  if (text.length > LONG_TEXT_LIMIT) return 'Lang. Der Code wird dicht und schwerer scanbar.';
  return `${KIND_LABEL[info.kind]} · ${text.length} Zeichen`;
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
  const info = text ? analyze(text) : null;
  const tooLong = !!info && info.bytes > MAX_BYTES;
  current = info && !tooLong ? info : null;
  sticker.classList.toggle('is-error', tooLong);
  emptyNote.textContent = tooLong ? 'Zu viel Text für einen QR-Code.' : EMPTY_TEXT;
  status.classList.toggle('is-error', tooLong);
  btnPng.disabled = !current;
  status.textContent = info ? describe(info, text) : '\u00a0';
  if (!current) {
    sticker.classList.add('is-empty');
    scanEl.hidden = true;
  }
  refresh();
});

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

async function busy(btn, fn) {
  const label = btn.textContent;
  btn.disabled = true;
  try { await fn(); } finally { btn.disabled = btn === btnPng ? !current : false; btn.textContent = label; }
}

btnPng.addEventListener('click', () => {
  if (!current) return;
  const fmt = format;
  return busy(btnPng, async () => {
    const blob = await renderBlob(current.data, fmt, exportStyle());
    saveBlob(blob, `${fileName(current)}.${FORMATS[fmt].ext}`);
    showToast(`${FORMATS[fmt].label} gespeichert`);
  });
});

// --- Gestalten-Bereich: auf dem Handy zugeklappt, am Desktop offen ---
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
// Gesperrte Elemente: Klick öffnet den Pro-Hinweis. Gibt true zurück, wenn gesperrt.
function gated() {
  if (proActive) return false;
  openDialog(proDialog);
  return true;
}
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

// --- Farben (gesperrt: nur Vorschau mit Band, der Download bleibt schwarz-weiss) ---
const swatchBox = $('swatches');
swatchBox.innerHTML = PRO_SWATCHES.map(
  (s, i) => `<button type="button" class="swatch" style="--swatch:${s.color}" data-color="${s.color}" aria-pressed="${i === 0}" aria-label="${s.name}${PRO_REQUIRED ? ' (Vorschau)' : ''}"></button>`
).join('');
function updateRibbon() {
  ribbon.hidden = proActive || style.color === '#000000';
}
swatchBox.addEventListener('click', (e) => {
  const btn = e.target.closest('.swatch');
  if (!btn) return;
  style.color = btn.dataset.color;
  swatchBox.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  updateRibbon();
  refresh();
});

// --- Logo ---
const logoFile = $('logo-file');
const logoThumb = $('logo-thumb');
const logoRemove = $('logo-remove');
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
$('logo-btn').addEventListener('click', () => { if (!gated()) logoFile.click(); });
function setLogo(url) {
  style.logo = url;
  logoThumb.hidden = !url;
  logoThumb.src = url ?? '';
  logoRemove.hidden = !url;
  $('logo-btn').classList.toggle('has-logo', !!url);
  refresh();
}
logoFile.addEventListener('change', () => {
  const file = logoFile.files[0];
  logoFile.value = '';
  if (!file) return;
  if (file.size > LOGO_MAX_BYTES) return showToast('Das Logo ist zu gross (maximal 2 MB).');
  const reader = new FileReader();
  reader.onload = () => setLogo(reader.result);
  reader.readAsDataURL(file);
});
logoRemove.addEventListener('click', () => setLogo(null));

// --- Punktform (Gratis-Stil bleibt Rund) ---
const dotBox = $('dot-styles');
dotBox.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || (chip.dataset.dots !== 'dots' && gated())) return;
  style.dots = chip.dataset.dots;
  dotBox.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  refresh();
});

// --- Sticker: Form und Beschriftung ---
const shapeBox = $('shapes');
shapeBox.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || (chip.dataset.shape !== 'square' && gated())) return;
  style.shape = chip.dataset.shape;
  shapeBox.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  refresh();
});
const labelInput = $('label');
labelInput.addEventListener('focus', () => { if (gated()) labelInput.blur(); });
labelInput.addEventListener('input', () => { style.label = labelInput.value.trim(); refresh(); });
$('label-presets').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || gated()) return;
  labelInput.value = style.label = chip.dataset.label;
  refresh();
});

// --- Format ---
const formatBox = $('formats');
const sheetRow = $('sheet-row');
formatBox.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || (chip.dataset.format !== 'png' && gated())) return;
  format = chip.dataset.format;
  formatBox.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  sheetRow.hidden = format !== 'sheet';
  refresh();
});
$('sheet-sizes').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  style.sheetMm = Number(chip.dataset.mm);
  $('sheet-sizes').querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  refresh();
});

// --- Mehrere Codes aus CSV → ZIP ---
const csvFile = $('csv-file');
const csvBtn = $('csv-btn');
csvBtn.addEventListener('click', () => { if (!gated()) csvFile.click(); });
csvFile.addEventListener('change', async () => {
  const file = csvFile.files[0];
  csvFile.value = '';
  if (!file) return;
  csvBtn.disabled = true;
  const label = csvBtn.textContent;
  csvBtn.textContent = 'Codes werden erzeugt …';
  try {
    const fmt = ['pdf', 'svg', 'png-large'].includes(format) ? format : 'png';
    const { blob, count, skipped } = await buildZip(await file.text(), fmt, exportStyle());
    saveBlob(blob, 'qr-codes.zip');
    showToast(`${count} Codes gespeichert${skipped ? `, ${skipped} übersprungen (zu lang oder zu viele)` : ''}`);
  } catch {
    showToast('In der Datei steht nichts, woraus ein Code entstehen kann. Eine Zeile pro Code.');
  } finally {
    csvBtn.disabled = false;
    csvBtn.textContent = label;
  }
});

// --- Freischalten (nur bei PRO_REQUIRED): Schlösser öffnen sich nacheinander ---
function unlockPro() {
  proActive = true;
  updateRibbon();
  refresh();
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

refresh();
