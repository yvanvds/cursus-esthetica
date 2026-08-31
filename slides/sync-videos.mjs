// Leest de `videos:`-map uit de frontmatter van elk hoofdstuk en schrijft die
// naar één JSON-bestand in de gedeelde Slidev-addon. Zo staat de timing van een
// fragment op één plaats — in de cursustekst — en gebruiken de decks dezelfde
// waarden zonder dat de slidebuild de Astro-contentcollectie hoeft te kennen.
//
// Het gegenereerde bestand gaat mee in git, zodat `slidev dev` werkt zonder
// eerst een build te draaien. Draai `npm run sync:videos` na het wijzigen van
// een `videos:`-blok; `npm run build:slides` doet het automatisch.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const slidesDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(slidesDir, '..');
const themesDir = join(projectRoot, 'src', 'content', 'themes');
const outFile = join(slidesDir, 'theme', 'layouts-base', 'videos.generated.json');

function frontmatterOf(raw, file) {
  // CRLF normaliseren: anders houdt de laatste waarde vóór de sluitende `---`
  // een \r over, en parst YAML `start: 0` als de string "0\r".
  const source = raw.replace(/\r\n/g, '\n');
  if (!source.startsWith('---')) {
    throw new Error(`${file}: geen frontmatter gevonden`);
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    throw new Error(`${file}: frontmatter niet afgesloten`);
  }
  return parse(source.slice(3, end));
}

const videos = {};
let themeCount = 0;

for (const name of readdirSync(themesDir).filter(n => n.endsWith('.mdx')).sort()) {
  const themeId = name.replace(/\.mdx$/, '');
  const data = frontmatterOf(readFileSync(join(themesDir, name), 'utf8'), name);
  if (!data?.videos) continue;
  themeCount++;
  for (const [key, video] of Object.entries(data.videos)) {
    videos[`${themeId}/${key}`] = video;
  }
}

writeFileSync(outFile, `${JSON.stringify(videos, null, 2)}\n`);
console.log(
  `sync-videos: ${Object.keys(videos).length} fragment(en) uit ${themeCount} hoofdstuk(ken) → ${
    outFile.slice(projectRoot.length + 1)
  }`,
);
