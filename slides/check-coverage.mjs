// Dekkingscheck: toont per Slidev-deck welk beeld en welke video uit het
// bijbehorende hoofdstuk níét in het deck voorkomt.
//
// De regel staat in `.claude/skills/slidev/SKILL.md` §3: elke `figures:`-key en
// elke `videos:`-key uit de frontmatter van het hoofdstuk komt minstens één keer
// in het deck. Handmatig nakijken werkt niet — bij belgisch-experiment gaat het
// om 29 beelden over 96 slides — en de gaten vallen juist niet op: een
// figuurgroep van drie waarvan er één in het deck staat, ziet er compleet uit.
// Daarom rapporteert dit script per figuurgroep ("rosetta 1/3") en niet per los
// beeld.
//
// Aanroep: `npm run check:slides` (alle decks) of
// `npm run check:slides -- meerstemmigheid` (één of meer thema's).
//
// Dit is een rapport, geen gate: het zit niet in `npm run build`. Exitcode is 0
// als alles gedekt is en 1 als er iets ontbreekt, zodat het later desgewenst in
// een workflow kan.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const slidesDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(slidesDir, '..');
const themesDir = join(projectRoot, 'src', 'content', 'themes');

// `slides/theme/` bevat de Slidev-thema's en de gedeelde addon, geen deck.
const NON_DECK_DIRS = new Set(['theme']);

// Beeldpaden staan in een deck als volledig deploy-pad,
// `/cursus-esthetica/images/<theme-id>/<bestand>` (zie SKILL.md §7).
const siteBase = readSiteBase();

// Grijpt het pad mét eventuele prefix, zodat een deck dat de base vergeet
// zichtbaar wordt in plaats van stil als "gedekt" te tellen.
const IMAGE_RE = /[^\s"'`()[\]{}<>,]*\/images\/[A-Za-z0-9._\-/]+/g;

// `<CourseVideo id="..." />` en `<CourseVideoInline id="...">`; id is
// `<theme-id>/<video-key>`. Attribuutvolgorde ligt niet vast, vandaar `[^>]*`.
const VIDEO_RE =
  /<CourseVideo(?:Inline)?\b[^>]*\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"]([^'"]*)['"]\s*\})/g;

function readSiteBase() {
  try {
    const config = readFileSync(join(projectRoot, 'astro.config.mjs'), 'utf8');
    return /base:\s*['"]([^'"]*)['"]/.exec(config)?.[1] ?? '';
  } catch {
    return '';
  }
}

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
  return parse(source.slice(3, end)) ?? {};
}

// Een figuurgroep is altijd `key: { images: [{ src: ... }] }`. Dat is geen
// aanname maar afgedwongen: `src/content.config.ts` zet `.strict()` op het
// schema, dus elke andere vorm faalt op `npx astro check`. Vandaar geen
// tolerantie voor varianten hier — die zou een schemafout stil maken.
function imagesOfGroup(group) {
  return (group?.images ?? []).map(entry => entry?.src).filter(Boolean);
}

function deckReferences(raw) {
  const source = raw.replace(/\r\n/g, '\n');
  const images = new Set();
  const wrongPrefix = new Set();
  for (const [match] of source.matchAll(IMAGE_RE)) {
    const start = match.indexOf('/images/');
    const path = match.slice(start);
    const prefix = match.slice(0, start);
    images.add(path);
    if (prefix !== siteBase) wrongPrefix.add(match);
  }
  const videos = new Set();
  for (const match of source.matchAll(VIDEO_RE)) {
    const id = match[1] ?? match[2] ?? match[3];
    if (id) videos.add(id.trim());
  }
  return { images, videos, wrongPrefix };
}

function fileNameOf(path) {
  return path.slice(path.lastIndexOf('/') + 1);
}

const requested = process.argv.slice(2).filter(arg => !arg.startsWith('-'));

const decks = readdirSync(slidesDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && !NON_DECK_DIRS.has(entry.name))
  .map(entry => entry.name)
  .filter(name => existsSync(join(slidesDir, name, 'slides.md')))
  .filter(name => requested.length === 0 || requested.includes(name))
  .sort();

const unknown = requested.filter(name => !decks.includes(name));
for (const name of unknown) {
  console.error(`let op: geen deck gevonden onder slides/${name}/slides.md`);
}

if (decks.length === 0) {
  console.error('Geen decks gevonden.');
  process.exit(1);
}

let incomplete = 0;

for (const themeId of decks) {
  const themeFile = join(themesDir, `${themeId}.mdx`);
  if (!existsSync(themeFile)) {
    console.log(`${themeId}\n  geen hoofdstuk src/content/themes/${themeId}.mdx — overgeslagen\n`);
    incomplete++;
    continue;
  }

  const chapter = frontmatterOf(readFileSync(themeFile, 'utf8'), `${themeId}.mdx`);
  const deck = deckReferences(readFileSync(join(slidesDir, themeId, 'slides.md'), 'utf8'));

  // Beelden, per figuurgroep, zodat "1 van 3" zichtbaar is.
  const groups = [];
  let imageTotal = 0;
  let imageCovered = 0;
  for (const [key, group] of Object.entries(chapter.figures ?? {})) {
    const images = imagesOfGroup(group);
    if (images.length === 0) continue;
    const missing = images.filter(src => !deck.images.has(src));
    imageTotal += images.length;
    imageCovered += images.length - missing.length;
    if (missing.length > 0) {
      groups.push({ key, have: images.length - missing.length, total: images.length, missing });
    }
  }

  // Video's, per key uit de frontmatter; in het deck is de id `<theme-id>/<key>`.
  const videoKeys = Object.keys(chapter.videos ?? {});
  const missingVideos = videoKeys.filter(key => !deck.videos.has(`${themeId}/${key}`));

  const complete = groups.length === 0 && missingVideos.length === 0;
  if (!complete) incomplete++;

  const heading = [
    themeId.padEnd(22),
    `beelden ${String(imageCovered).padStart(2)}/${String(imageTotal).padEnd(2)}`,
    `video's ${missingVideos.length === 0 ? videoKeys.length : videoKeys.length - missingVideos.length}/${videoKeys.length}`,
    complete ? '  volledig' : '',
  ].join('  ');
  console.log(heading.trimEnd());

  for (const group of groups) {
    const names = group.missing.map(fileNameOf).join(', ');
    console.log(`    ${group.key.padEnd(24)} ${group.have}/${group.total}   mist: ${names}`);
  }
  if (missingVideos.length > 0) {
    console.log(`    ${'video ontbreekt'.padEnd(24)}       ${missingVideos.join(', ')}`);
  }
  for (const path of deck.wrongPrefix) {
    console.log(`    let op: beeldpad zonder '${siteBase}' — ${path}`);
  }
  console.log('');
}

if (incomplete === 0) {
  console.log(`Alle ${decks.length} deck(s) tonen elk beeld en elke video uit hun hoofdstuk.`);
  process.exit(0);
}

console.log(`${incomplete} van ${decks.length} deck(s) missen beeld of video uit het hoofdstuk.`);
process.exit(1);
