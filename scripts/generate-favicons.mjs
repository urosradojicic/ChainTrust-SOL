#!/usr/bin/env node
/**
 * Render the SVG logomark master at brand/logomark.svg into the
 * favicon raster set + write the PWA manifest.
 *
 * Outputs (in public/):
 *   - favicon-16x16.png
 *   - favicon-32x32.png
 *   - favicon-48x48.png
 *   - apple-touch-icon.png  (180×180, iOS home screen)
 *   - android-chrome-192x192.png
 *   - android-chrome-512x512.png
 *   - logomark.svg          (canonical SVG favicon for modern browsers)
 *   - site.webmanifest
 *
 * Why Playwright: it ships with Chromium (already a dev dep for the
 * pitch-deck PDF). Using `chromium.launch().pdf()` for raster would be
 * wasteful — instead we set viewport, navigate to the SVG file:// URL,
 * and screenshot. Same result, no extra deps.
 *
 * Run: node scripts/generate-favicons.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const masterPath = resolve(root, 'brand', 'logomark.svg');
const publicDir = resolve(root, 'public');

if (!existsSync(masterPath)) {
  console.error(`✗ Master not found: ${masterPath}`);
  process.exit(1);
}

// Sizes we render at. Pure pixel sizes — the SVG is 512×512 viewBox so
// every render scales cleanly.
const TARGETS = [
  { file: 'favicon-16x16.png',          size: 16 },
  { file: 'favicon-32x32.png',          size: 32 },
  { file: 'favicon-48x48.png',          size: 48 },
  { file: 'apple-touch-icon.png',       size: 180 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
];

// System Chrome lookup — same fallback as scripts/generate-pitch-pdf.mjs
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

const svg = readFileSync(masterPath, 'utf8');

const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  for (const { file, size } of TARGETS) {
    const context = await browser.newContext({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    // data: URL avoids any disk I/O between renders. Set body/html to zero
    // margin so the SVG fills the viewport exactly.
    await page.setContent(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}svg{width:${size}px;height:${size}px;display:block}</style></head><body>${svg}</body></html>`,
      { waitUntil: 'domcontentloaded' },
    );
    const png = await page.screenshot({
      omitBackground: false,
      type: 'png',
      clip: { x: 0, y: 0, width: size, height: size },
    });
    const outPath = resolve(publicDir, file);
    writeFileSync(outPath, png);
    console.log(`  ${file.padEnd(32)} ${size}×${size}  ${png.length.toLocaleString()} bytes`);
    await context.close();
  }
} finally {
  await browser.close();
}

// Also drop the SVG itself into public/ as logomark.svg (modern browsers
// prefer SVG favicons; this is the highest-quality option).
writeFileSync(resolve(publicDir, 'logomark.svg'), svg);
console.log(`  logomark.svg                     vector   ${svg.length.toLocaleString()} bytes`);

// Write the PWA manifest pointing at the new icons.
const manifest = {
  name: 'ChainTrust',
  short_name: 'ChainTrust',
  description: 'The trust layer for Solana startup fundraising. Founders publish metrics on-chain, oracles verify, investors get cryptographic proof chains.',
  start_url: '/',
  display: 'standalone',
  background_color: '#0B1437',
  theme_color: '#0B1437',
  icons: [
    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: '/logomark.svg',                sizes: 'any',    type: 'image/svg+xml', purpose: 'any maskable' },
  ],
};
writeFileSync(resolve(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log(`  site.webmanifest                 manifest`);

console.log(`\n✓ Wrote ${TARGETS.length + 2} files into ${publicDir}`);
console.log(`  Update index.html to reference these (apple-touch-icon, manifest, etc.)`);
