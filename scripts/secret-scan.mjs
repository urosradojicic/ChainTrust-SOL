#!/usr/bin/env node
/**
 * Lightweight secret scanner for staged files (or, with --all, the
 * entire working tree). Designed to fail fast in pre-commit hooks
 * and in CI without adding a Go-binary dependency.
 *
 * Usage:
 *   node scripts/secret-scan.mjs              # scan staged files (pre-commit)
 *   node scripts/secret-scan.mjs --all        # scan tracked files at HEAD
 *   node scripts/secret-scan.mjs file [...]   # scan explicit file paths
 *
 * Pattern coverage:
 *   - AWS access keys (AKIA...)
 *   - Private keys (RSA, EC, DSA, OpenSSH, PGP)
 *   - Stripe / GitHub / Slack / Twilio / SendGrid tokens
 *   - Generic high-entropy `secret/password/token/api_key` lines
 *   - Supabase service-role JWT (eyJ-prefixed with "service_role" claim)
 *
 * What it does NOT replace: gitleaks/trufflehog as a CI tool. This is
 * the inner backstop. CI should still run gitleaks-action when configured.
 *
 * Implementation note: uses execFileSync with explicit argv (no shell)
 * so there's no path through which user input could reach a shell.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const PATTERNS = [
  { name: 'AWS access key',         re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'AWS secret access key',  re: /\baws_secret_access_key\s*=\s*["'][a-zA-Z0-9/+=]{40}["']/gi },
  { name: 'Private key block',      re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY/g },
  { name: 'Stripe live key',        re: /\b(sk|rk)_live_[a-zA-Z0-9]{24,}\b/g },
  { name: 'GitHub PAT',             re: /\b(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b/g },
  { name: 'Slack token',            re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'SendGrid API key',       re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
  { name: 'Twilio API key',         re: /\bSK[a-z0-9]{32}\b/g },
  { name: 'Supabase service-role JWT', re: /eyJ[A-Za-z0-9_-]+\.eyJ[^\s"'<>]*service_role[^\s"'<>]+\.[A-Za-z0-9_-]{30,}/g },
  // Heuristic: assignment of a long opaque string to something named secret/token/password/api_key.
  { name: 'Generic secret assignment',
    re: /\b(api[_-]?key|secret|password|token|access[_-]?key)\s*[:=]\s*["'][a-zA-Z0-9_\-+\/=]{20,}["']/gi },
];

const IGNORE_PATHS = [
  /\bnode_modules\b/,
  /\bdist\b/,
  /\bbuild\b/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /scripts\/secret-scan\.mjs$/,
  /SECURITY_AUDIT.*\.md$/i,
  /AUDIT\.md$/i,
  /docs\/internal\/security-audit/,
  /\.(png|jpg|jpeg|gif|pdf|ico|woff2?)$/,
];

// Tokens documented as public-by-design in SECURITY.md.
const ALLOWED_LITERALS = [
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSI/i,
];

function isIgnored(path) {
  return IGNORE_PATHS.some((re) => re.test(path));
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function getFiles() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const out = git('diff', '--cached', '--name-only', '--diff-filter=ACM');
    return out ? out.split('\n').filter(Boolean) : [];
  }
  if (args[0] === '--all') {
    const out = git('ls-files');
    return out ? out.split('\n').filter(Boolean) : [];
  }
  return args;
}

const files = getFiles().filter((f) => !isIgnored(f) && existsSync(f));
const findings = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const { name, re } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const matched = m[0];
      if (ALLOWED_LITERALS.some((al) => al.test(matched))) continue;
      const lineNum = content.slice(0, m.index).split('\n').length;
      const line = content.split('\n')[lineNum - 1].trim();
      findings.push({ file, line: lineNum, name, snippet: line.slice(0, 120) });
    }
  }
}

if (findings.length === 0) {
  console.log(`✓ secret-scan: ${files.length} files clean`);
  process.exit(0);
}

console.error(`\n✗ secret-scan: ${findings.length} potential leak(s) detected\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.name}]`);
  console.error(`    ${f.snippet}`);
}
console.error('\nIf this is a false positive, add the literal to ALLOWED_LITERALS in scripts/secret-scan.mjs and document why in SECURITY.md.\n');
process.exit(1);
