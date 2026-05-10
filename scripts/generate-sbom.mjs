#!/usr/bin/env node
/**
 * Generate a CycloneDX-format SBOM (Software Bill of Materials) from the
 * committed package-lock.json. No new dependencies required.
 *
 * Output: sbom.cyclonedx.json at repo root, attachable to a GitHub release.
 *
 * Format reference:
 *   https://cyclonedx.org/specification/
 *
 * Why we don't use `npm sbom`: that command requires the dependency tree
 * to satisfy peer-dep constraints exactly. Solana's wallet-adapter peer
 * ranges break this on most installs. Reading package-lock.json directly
 * produces an equivalent SBOM without the strictness.
 *
 * Why we don't use `@cyclonedx/cdxgen`: it adds 200+ transitive deps and
 * mostly does what we do here. Boring beats trendy.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const lockPath = resolve(root, 'package-lock.json');
const pkgPath = resolve(root, 'package.json');
const outPath = resolve(root, 'sbom.cyclonedx.json');

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const components = [];
for (const [path, info] of Object.entries(lock.packages || {})) {
  if (!path) continue;
  const name = info.name ?? path.split('node_modules/').pop();
  if (!name) continue;
  const version = info.version;
  if (!version) continue;

  const purl = `pkg:npm/${encodeURIComponent(name)}@${version}`;
  const component = {
    type: 'library',
    'bom-ref': purl,
    name,
    version,
    purl,
  };
  if (info.license) component.licenses = [{ license: { id: info.license } }];
  if (info.integrity) {
    const m = /^(sha\d+)-(.+)$/.exec(info.integrity);
    if (m) {
      component.hashes = [{ alg: m[1].toUpperCase().replace(/SHA(\d+)/, 'SHA-$1'), content: m[2] }];
    }
  }
  if (info.resolved) component.externalReferences = [{ type: 'distribution', url: info.resolved }];
  components.push(component);
}

const now = new Date().toISOString();
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  serialNumber: `urn:uuid:${randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: now,
    tools: [{ vendor: 'ChainTrust', name: 'scripts/generate-sbom.mjs', version: '1.0' }],
    component: {
      type: 'application',
      'bom-ref': `pkg:generic/${pkg.name}@${pkg.version}`,
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
    },
  },
  components,
};

writeFileSync(outPath, JSON.stringify(sbom, null, 2));

const hash = createHash('sha256').update(JSON.stringify(sbom)).digest('hex');
console.log(`✓ Wrote ${outPath}`);
console.log(`  ${components.length} components`);
console.log(`  sha256: ${hash}`);
