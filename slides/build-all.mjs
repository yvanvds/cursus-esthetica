import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixDoubledSiteBase } from './build-postprocess.mjs';

const slidesDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(slidesDir, '..');
const SITE_BASE = '/cursus-esthetica';

const decks = readdirSync(slidesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'theme')
  .map((d) => d.name)
  .filter((name) => existsSync(join(slidesDir, name, 'slides.md')));

if (decks.length === 0) {
  console.log('No decks found under slides/. Skipping Slidev build.');
  process.exit(0);
}

console.log(`Building ${decks.length} deck(s): ${decks.join(', ')}`);

for (const id of decks) {
  const entry = join(slidesDir, id, 'slides.md');
  const out = join(projectRoot, 'dist', 'slides', id);
  const base = `${SITE_BASE}/slides/${id}/`;
  console.log(`\n=== ${id} → dist/slides/${id} (base ${base}) ===`);
  const result = spawnSync(
    'npx',
    ['slidev', 'build', entry, '--out', out, '--base', base],
    { stdio: 'inherit', shell: true, cwd: projectRoot },
  );
  if (result.status !== 0) {
    console.error(`Build failed for ${id} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  const fixed = fixDoubledSiteBase({ distDir: out, deckBase: base, siteBase: SITE_BASE });
  if (fixed > 0) {
    console.log(`Rewrote doubled site-base URLs in ${fixed} file(s) for ${id}`);
  }
}

console.log(`\nBuilt ${decks.length} deck(s) into dist/slides/`);
