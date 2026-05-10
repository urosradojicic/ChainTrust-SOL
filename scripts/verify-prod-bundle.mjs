#!/usr/bin/env node
/**
 * Smoke-test the production bundle by loading it in headless Chrome and
 * scraping the console for runtime errors. Used to verify the TDZ fix
 * before redeploying.
 *
 * Usage: node scripts/verify-prod-bundle.mjs http://127.0.0.1:4173
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:4173';

const SYSTEM_CHROME = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p));

const browser = await chromium.launch(SYSTEM_CHROME ? { executablePath: SYSTEM_CHROME } : {});
const page = await browser.newPage();

const errors = [];
const consoleMessages = [];
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}\n  stack: ${err.stack || '(none)'}`));
page.on('console', (msg) => {
  const t = msg.type();
  if (t === 'error') errors.push(`console.error: ${msg.text()}`);
  consoleMessages.push(`[${t}] ${msg.text()}`);
});

console.log(`Navigating to ${url}…`);
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
} catch (e) {
  console.error('Navigation failed:', e.message);
}

const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? null);
const rootChildCount = await page.evaluate(() => document.getElementById('root')?.children.length ?? 0);
const title = await page.title();

console.log('\n── Result ─────────────────────');
console.log('Title:', title);
console.log('#root child count:', rootChildCount);
console.log('#root has content:', rootHtml ? rootHtml.length > 0 : false);
console.log('Errors captured:', errors.length);
if (errors.length) {
  console.log('\nErrors:');
  errors.forEach((e) => console.log(' -', e));
}
console.log('\nLast 8 console messages:');
consoleMessages.slice(-8).forEach((m) => console.log(' ', m));

await browser.close();

if (errors.length || rootChildCount === 0) {
  console.log('\n✗ Bundle did not render cleanly.');
  process.exit(1);
}
console.log('\n✓ Bundle rendered without runtime errors.');
