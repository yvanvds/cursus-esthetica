import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REWRITE_EXTENSIONS = /\.(html|js|mjs|css|map)$/;

/**
 * Slidev/Vite prefixt de deck-base aan elk `/`-pad in templates. Voor paden
 * die al absoluut zijn t.o.v. de site (`/<siteBase>/images/...`) levert dat
 * een dubbele prefix op (`/<deckBase>/<siteBase>/images/...`). Deze functie
 * herstelt dat over de gebouwde output.
 */
export function fixDoubledSiteBase({ distDir, deckBase, siteBase = '/cursus-esthetica' }) {
  const normalizedSite = siteBase.replace(/\/$/, '');
  const doubled = deckBase.replace(/\/$/, '') + normalizedSite + '/';
  const correct = normalizedSite + '/';
  if (doubled === correct) return 0;
  try {
    if (!statSync(distDir).isDirectory()) return 0;
  } catch {
    return 0;
  }
  let touched = 0;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(p);
        continue;
      }
      if (!REWRITE_EXTENSIONS.test(entry.name)) continue;
      const orig = readFileSync(p, 'utf8');
      if (!orig.includes(doubled)) continue;
      writeFileSync(p, orig.split(doubled).join(correct));
      touched += 1;
    }
  };
  walk(distDir);
  return touched;
}
