// Hoofdstukcontrole: legt de frontmatter van elk hoofdstuk naast de schijf en
// naast de body.
//
// `work-issues` §3d vroeg dit met de hand, en die stap is drie keer gemist
// (#43): drie hoofdstukken verwezen naar een beeldbestand dat niet bestond.
// Niets vangt dat af — `astro check` valideert het schema maar niet de schijf,
// en `remark-figure-links` faalt stil op een onbekende key. Vandaar dit script.
//
// Het loopt over álle hoofdstukken, niet alleen die met een Slidev-deck: dit is
// een hoofdstukcontrole, geen deckcontrole. Voor de deckdekking bestaat
// `npm run check:slides` (slides/check-coverage.mjs).
//
// Gecontroleerd wordt, per hoofdstuk:
//   1. elke `src:` uit `figures:` bestaat als bestand onder `public/`;
//   2. elke figuurafbeelding heeft een `source:`;
//   3. elke `figures:`- en `videos:`-key komt minstens één keer in de body voor;
//   4. elke `fig:`/`video:`-verwijzing in de body heeft een key in de
//      frontmatter;
//   5. het header-beeld (`image:`) bestaat als bestand onder `public/`.
//
// Aanroep: `npm run check:chapters` (alle hoofdstukken) of
// `npm run check:chapters -- belgisch-experiment` (één of meer thema's).
//
// Exitcode 0 als alles klopt, 1 als er iets mis is.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptsDir, '..');
const themesDir = join(projectRoot, 'src', 'content', 'themes');
const publicDir = join(projectRoot, 'public');

// `[tekst](fig:key)` en `[tekst](video:key)`. De figuurvariant mag een query
// dragen (`fig:key?icon=film`, zie src/lib/remark-figure-links.ts); die hoort
// niet bij de key.
const REFERENCE_RE = /\]\((fig|video):([^)\s?]+)(\?[^)\s]*)?\)/g;

function frontmatterOf(raw, file) {
  // CRLF normaliseren: anders houdt de laatste waarde vóór de sluitende `---`
  // een \r over (zie slides/check-coverage.mjs).
  const source = raw.replace(/\r\n/g, '\n');
  if (!source.startsWith('---')) {
    throw new Error(`${file}: geen frontmatter gevonden`);
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    throw new Error(`${file}: frontmatter niet afgesloten`);
  }
  return {
    data: parse(source.slice(3, end)) ?? {},
    body: source.slice(source.indexOf('\n', end + 1) + 1),
  };
}

// Een sitepad (`/images/...`) wijst naar `public/`. Astro's `base` speelt hier
// geen rol: in de frontmatter staat het pad zonder prefix.
function publicPathOf(src) {
  return join(publicDir, src.replace(/^\//, '').split('/').join('/'));
}

function referencesIn(body) {
  const figures = new Set();
  const videos = new Set();
  for (const match of body.matchAll(REFERENCE_RE)) {
    (match[1] === 'fig' ? figures : videos).add(match[2]);
  }
  return { figures, videos };
}

const requested = process.argv.slice(2).filter(arg => !arg.startsWith('-'));

const themes = readdirSync(themesDir)
  .filter(name => name.endsWith('.mdx'))
  .map(name => name.slice(0, -'.mdx'.length))
  .filter(name => requested.length === 0 || requested.includes(name))
  .sort();

for (const name of requested.filter(name => !themes.includes(name))) {
  console.error(`let op: geen hoofdstuk gevonden onder src/content/themes/${name}.mdx`);
}

if (themes.length === 0) {
  console.error('Geen hoofdstukken gevonden.');
  process.exit(1);
}

let chaptersWithProblems = 0;
let problemTotal = 0;

for (const themeId of themes) {
  const { data, body } = frontmatterOf(
    readFileSync(join(themesDir, `${themeId}.mdx`), 'utf8'),
    `${themeId}.mdx`
  );

  const problems = [];
  const figures = data.figures ?? {};
  const videos = data.videos ?? {};
  const used = referencesIn(body);

  let imageCount = 0;

  for (const [key, group] of Object.entries(figures)) {
    for (const image of group?.images ?? []) {
      imageCount++;
      const src = image?.src;
      if (!src) {
        problems.push(`${key}: beeld zonder src:`);
        continue;
      }
      if (!existsSync(publicPathOf(src))) {
        problems.push(`${key}: bestand ontbreekt onder public/ — ${src}`);
      }
      if (!image?.source) {
        problems.push(`${key}: geen source: bij ${src}`);
      }
    }
  }

  for (const key of Object.keys(figures)) {
    if (!used.figures.has(key)) {
      problems.push(`${key}: figuurgroep wordt nergens in de body gebruikt`);
    }
  }
  for (const key of Object.keys(videos)) {
    if (!used.videos.has(key)) {
      problems.push(`${key}: video wordt nergens in de body gebruikt`);
    }
  }
  for (const key of used.figures) {
    if (!(key in figures)) {
      problems.push(`fig:${key} in de body heeft geen key in de frontmatter`);
    }
  }
  for (const key of used.videos) {
    if (!(key in videos)) {
      problems.push(`video:${key} in de body heeft geen key in de frontmatter`);
    }
  }

  if (data.image && !existsSync(publicPathOf(data.image))) {
    problems.push(`header-beeld ontbreekt onder public/ — ${data.image}`);
  }

  const heading = [
    themeId.padEnd(28),
    `beelden ${String(imageCount).padStart(2)}`,
    `figuren ${String(Object.keys(figures).length).padStart(2)}`,
    `video's ${String(Object.keys(videos).length).padStart(2)}`,
    problems.length === 0 ? '  in orde' : `  ${problems.length} probleem/problemen`,
  ].join('  ');
  console.log(heading);

  for (const problem of problems) {
    console.log(`    ${problem}`);
  }

  if (problems.length > 0) {
    chaptersWithProblems++;
    problemTotal += problems.length;
    console.log('');
  }
}

console.log('');
if (chaptersWithProblems === 0) {
  console.log(`Alle ${themes.length} hoofdstuk(ken) in orde.`);
  process.exit(0);
}

console.log(
  `${problemTotal} probleem/problemen in ${chaptersWithProblems} van ${themes.length} hoofdstuk(ken).`
);
process.exit(1);
