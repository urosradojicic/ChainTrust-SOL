#!/usr/bin/env node
/**
 * Generate judges/pitch-deck.pdf from judges/pitch-deck.html
 *
 * Run with: node scripts/generate-pitch-pdf.mjs
 *
 * Uses Playwright's headless Chromium (already a dev dep) to render the
 * print-stylesheet version of the HTML to PDF. Same output you'd get from
 * Chrome's "Print → Save as PDF" dialog, just deterministic + scriptable.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '..', 'judges', 'pitch-deck.html');
const pdfPath  = resolve(__dirname, '..', 'judges', 'pitch-deck.pdf');

// Use the system Chrome if present; falls back to Playwright's bundled
// Chromium otherwise. Avoids re-downloading 200MB of browser binaries when
// a perfectly good Chrome is already on the machine.
const SYSTEM_CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];
const fs = await import('node:fs');
const executablePath = SYSTEM_CHROME_CANDIDATES.find((p) => fs.existsSync(p));

const browser = await chromium.launch(executablePath ? { executablePath } : {});
const context = await browser.newContext();
const page = await context.newPage();

// file:// URL so relative asset paths (banner.svg, screenshots/*) resolve.
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,           // honour our brand colors / cover page gradient
  preferCSSPageSize: true,         // respect @page rules in the stylesheet
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});

await browser.close();
console.log(`✓ Wrote ${pdfPath}`);
