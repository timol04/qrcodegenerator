import './style.css';
import '@fontsource/schibsted-grotesk/latin-400.css';
import '@fontsource/schibsted-grotesk/latin-500.css';
import '@fontsource/schibsted-grotesk/latin-600.css';
import '@fontsource/schibsted-grotesk/latin-700.css';
import { UPGRADE_URL, PRO_SWATCHES, LONG_TEXT_LIMIT, PRO_REQUIRED } from './config.js';
import { renderBlob, saveBlob, sheetInfo, pagePreview, FORMATS } from './qr.js';
import { composeCanvas, scanTest, geometry } from './sticker.js';
import { t, applyI18n, setLang, getLang, onLangChange } from './i18n.js';
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
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// --- Gratis-Modus (config.js): alles frei nutzbar, ohne Schloss und Kaufhinweise ---
root.dataset.pro = PRO_REQUIRED ? 'locked' : 'free';
let proActive = !PRO_REQUIRED;
if (!PRO_REQUIRED) {
  $('pro-title').dataset.i18n = 'pro.titleFree';
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
  themeBtn.setAttribute('aria-label', isDark() ? t('theme.toLight') : t('theme.toDark'));
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
const style = { color: '#000000', logo: null, logoMode: 'shape', logoStrength: 0.5, dots: 'rounded', shape: 'square', label: '', sheetMm: 40 };
let format = 'png';
let current = null; // { kind, data, bytes } oder null, wenn nichts (Gültiges) eingegeben ist
// Bei gesperrtem Pro gilt für Export nur der Gratis-Stil; Farbe und Vorschau sind dann reine Vorschau.
const exportStyle = () => (proActive ? { ...style } : {});

const PREVIEW_W = 560;
const scanEl = $('scan');
let renderId = 0;
let scanTimer;

const fmtLabel = (f) => t(`fmt.${f}`);

function captionText() {
  const f = FORMATS[format];
  if (format === 'sheet') {
    const { count } = sheetInfo(style.sheetMm, exportStyle());
    return t('cap.sheet', { count, cm: style.sheetMm / 10 });
  }
  if (format === 'png' || format === 'png-large') {
    const h = Math.round(f.size * geometry(exportStyle().shape, exportStyle().label).h);
    return t('cap.png', { w: f.size, h });
  }
  return t(`cap.${format}`);
}

async function refresh() {
  btnPng.textContent = t('dl.btn', { format: fmtLabel(format) });
  $('mat-caption').textContent = captionText();
  $('sheet-count').textContent = format === 'sheet' ? t('sheet.perPage', { n: sheetInfo(style.sheetMm, exportStyle()).count }) : '';
  const id = ++renderId;
  clearTimeout(scanTimer);
  if (!current) return;
  const canvas = await composeCanvas(current.data, PREVIEW_W, style);
  if (id !== renderId) return;
  // PDF und Stickerbogen: die ganze A4-Seite zeigen, damit man sich das Ergebnis vorstellen kann
  const page = format === 'pdf' || format === 'sheet';
  preview.replaceChildren(page ? pagePreview(canvas, format, style) : canvas);
  sticker.classList.toggle('is-page', page);
  sticker.classList.remove('is-empty');
  landSticker();
  // Scan-Test mit kurzer Verzögerung, damit das Tippen nicht ruckelt
  scanTimer = setTimeout(async () => {
    const level = await scanTest(canvas, current.data);
    if (id !== renderId) return;
    scanEl.hidden = false;
    scanEl.dataset.level = level;
    scanEl.dataset.level = level;
    scanEl.textContent = t(`scan.${level}`);
  }, 150);
}

// --- QR-Code ---
sticker.classList.add('is-empty');

let lastInfo = null;
function describe(info, text) {
  if (info.bytes > MAX_BYTES) return t('status.tooLong');
  if (text.length > LONG_TEXT_LIMIT) return t('status.long');
  return t('status.chars', { kind: t(`kind.${info.kind}`), n: text.length });
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
  lastInfo = info ? { info, text } : null;
  current = info && !tooLong ? info : null;
  sticker.classList.toggle('is-error', tooLong);
  emptyNote.dataset.i18n = tooLong ? 'mat.tooMuch' : 'mat.empty';
  emptyNote.textContent = t(emptyNote.dataset.i18n);
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
    showToast(t('dl.done', { format: fmtLabel(fmt) }));
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
  if (proActive) { showToast(t('lic.already')); return; }
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
  if (!isCompleteKey(key)) return fail(t('lic.invalid'));
  const result = await verifyKey(key);
  if (result === 'ok') { licenseDialog.close(); unlockPro(); }
  else if (result === 'unavailable') fail(t('lic.unavailable'));
  else fail(t('lic.invalid'));
});

// --- Farben (gesperrt: nur Vorschau mit Band, der Download bleibt schwarz-weiss) ---
const swatchBox = $('swatches');
const swatchCss = (c) => (Array.isArray(c) ? `linear-gradient(135deg, ${c[0]}, ${c[1]})` : c);
swatchBox.innerHTML = PRO_SWATCHES.map(
  (s, i) => `<button type="button" class="swatch" style="--swatch:${swatchCss(s.color)}" data-i="${i}" aria-pressed="${i === 0}" aria-label="${t('sw.' + s.name)}${PRO_REQUIRED ? ` (${t('colors.preview')})` : ''}"></button>`
).join('');
function updateRibbon() {
  ribbon.hidden = proActive || style.color === '#000000';
}
swatchBox.addEventListener('click', (e) => {
  const btn = e.target.closest('.swatch');
  if (!btn) return;
  style.color = PRO_SWATCHES[Number(btn.dataset.i)].color;
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
  $('logo-modes').hidden = !url;
  syncStrengthRow();
  $('logo-btn').classList.toggle('has-logo', !!url);
  refresh();
}
logoFile.addEventListener('change', () => {
  const file = logoFile.files[0];
  logoFile.value = '';
  if (!file) return;
  if (file.size > LOGO_MAX_BYTES) return showToast(t('logo.tooBig'));
  const reader = new FileReader();
  reader.onload = () => setLogo(reader.result);
  reader.readAsDataURL(file);
});
function syncStrengthRow() {
  $('logo-strength-row').hidden = !style.logo || style.logoMode !== 'shape';
}
$('logo-strength').addEventListener('input', (e) => {
  style.logoStrength = Number(e.target.value) / 100;
  refresh();
});
logoRemove.addEventListener('click', () => setLogo(null));
$('logo-modes').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  style.logoMode = chip.dataset.logomode;
  syncStrengthRow();
  $('logo-modes').querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  refresh();
});

// --- Punktform (Gratis-Stil bleibt Weich) ---
const dotBox = $('dot-styles');
dotBox.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || (chip.dataset.dots !== 'rounded' && gated())) return;
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
  labelInput.value = style.label = chip.textContent;
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
  // Auf dem Handy liegt die Vorschau über den Einstellungen: nach der Wahl dorthin scrollen
  if (!wide.matches && current) $('mat').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
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
  csvBtn.textContent = t('batch.busy');
  try {
    const fmt = ['pdf', 'svg', 'png-large'].includes(format) ? format : 'png';
    const { blob, count, skipped } = await buildZip(await file.text(), fmt, exportStyle());
    saveBlob(blob, 'qr-codes.zip');
    showToast(t('batch.done', { n: count }) + (skipped ? t('batch.skipped', { n: skipped }) : ''));
  } catch {
    showToast(t('batch.empty'));
  } finally {
    csvBtn.disabled = false;
    csvBtn.textContent = t('batch.btn');
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
    label.querySelector('.pro-label-full').dataset.i18n = 'nav.active';
    label.querySelector('.pro-label-short').dataset.i18n = 'nav.active';
    applyI18n();
    showToast(t('lic.unlocked'));
  }, delay);
}

// --- Sprache ---
const langSelect = $('lang-select');
langSelect.value = getLang();
langSelect.addEventListener('change', () => setLang(langSelect.value));
function renderSwatchLabels() {
  swatchBox.querySelectorAll('.swatch').forEach((b) => {
    b.setAttribute('aria-label', t('sw.' + PRO_SWATCHES[Number(b.dataset.i)].name) + (PRO_REQUIRED ? ` (${t('colors.preview')})` : ''));
  });
}
onLangChange(() => {
  syncThemeLabel();
  renderSwatchLabels();
  if (lastInfo) status.textContent = describe(lastInfo.info, lastInfo.text);
  const level = scanEl.dataset.level;
  if (!scanEl.hidden && level) scanEl.textContent = t(`scan.${level}`);
  refresh();
});
applyI18n();
syncThemeLabel();
refresh();
