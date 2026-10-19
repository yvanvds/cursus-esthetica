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
// En los van de hoofdstukken, altijd over álle bestanden:
//   6. geen `:root` in `src/styles/themes/*.css`. Die bestanden zitten in de
//      CSS-bundel van élke hoofdstukpagina (ThemeLayout, #120); een
//      `:root`-blok geldt dus overal én verliest van tokens.css, dat met
//      dezelfde selector later in de bundel staat. Elke regel hoort onder
//      `html[data-theme="<id>"]`.
//   7. geen beeld onder `public/images/` met een EXIF-oriëntatietag ≠ 1 (#70).
//      De browser volgt die tag, maar elk gereedschap dat het beeld later
//      verkleint of herschrijft zonder hem toe te passen, laat gedraaide
//      pixels achter zonder tag. Zo zijn de beelden van #70 ontstaan: camera-
//      JPEG's met oriëntatie 6 op Commons, bij het downloaden verkleind en van
//      hun EXIF ontdaan. Een beeld hoort met rechtopstaande pixels in de repo
//      te staan. Wat deze controle níet ziet, is precies die eindtoestand:
//      gedraaide pixels zonder tag. Dat vangt alleen het oog.
//
// Aanroep: `npm run check:chapters` (alle hoofdstukken) of
// `npm run check:chapters -- belgisch-experiment` (één of meer thema's).
//
// Exitcode 0 als alles klopt, 1 als er iets mis is.

import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptsDir, '..');
const themesDir = join(projectRoot, 'src', 'content', 'themes');
const themeStylesDir = join(projectRoot, 'src', 'styles', 'themes');
const publicDir = join(projectRoot, 'public');
const imagesDir = join(publicDir, 'images');

// `[tekst](fig:key)` en `[tekst](video:key)`. De figuurvariant mag een query
// dragen (`fig:key?icon=film`, zie src/lib/remark-figure-links.ts); die hoort
// niet bij de key.
const REFERENCE_RE = /\]\((fig|video):([^)\s?]+)(\?[^)\s]*)?\)/g;

// Bevindingen die bekeken zijn en bewust blijven staan. Ze worden nog steeds
// getoond, maar tellen niet mee voor de exitcode — anders staat deze check
// permanent op rood en leest niemand hem nog, en dan verdwijnt een échte
// nieuwe bevinding in de ruis.
//
// Een regel hier hoort een reden te dragen en een issuenummer waar de
// beslissing valt. Zet er niets in om van een probleem af te zijn.
const AANVAARD = {
  meerstemmigheid: [
    {
      probleem: 'erraji: figuurgroep wordt nergens in de body gebruikt',
      reden: 'bewust: de twee portretten staan in het deck, niet in de cursustekst (#38)',
    },
  ],
  instrumentontwikkeling: [
    { probleem: 'pianola: geen source: bij /images/instrumentontwikkeling/pianola-2.png', reden: 'herkomst nog uit te zoeken (#53)' },
    { probleem: 'pianola: geen source: bij /images/instrumentontwikkeling/pianola-3.png', reden: 'herkomst nog uit te zoeken (#53)' },
  ],
  'onderwerpen-en-themas': [
    { probleem: 'banksy: geen source: bij /images/onderwerpen-en-themas/banksy-removal.jpg', reden: 'herkomst nog uit te zoeken (#53)' },
  ],
  'smaak-klasse-macht': [
    { probleem: 'cattelan: geen source: bij /images/smaak-klasse-macht/cattelan-parody.png', reden: 'herkomst nog uit te zoeken (#53)' },
  ],
};

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

// Regelnummers (vanaf 1) waarop `:root` als selector staat. Commentaar telt
// niet mee — een bestand mag uitleggen waarom er géén `:root` in staat — en
// wordt vervangen door spaties, zodat de regelnummers kloppen.
function rootSelectorLinesIn(css) {
  const stripped = css
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\n]/g, ' '));
  const lines = [];
  stripped.split('\n').forEach((line, index) => {
    if (/:root\b/.test(line)) lines.push(index + 1);
  });
  return lines;
}

// ---- EXIF-oriëntatie (punt 7) ----
// Een eigen lezer in plaats van sharp: sharp zit alleen transitief in het
// project (een optionele dependency van astro), en voor één tag uit de kop van
// een bestand is dat geen afhankelijkheid waard. De lezer herkent het formaat
// aan de magische bytes, niet aan de extensie, en leest alleen de koppen van
// de segmenten of chunks, niet de beelddata.

function readAt(fd, position, length) {
  const buffer = Buffer.alloc(Math.max(0, length));
  return buffer.subarray(0, readSync(fd, buffer, 0, buffer.length, position));
}

// Tag 0x0112 uit IFD0 van een TIFF-blok (de vorm waarin EXIF in alle drie de
// formaten zit), of null als hij ontbreekt.
function orientationInTiff(tiff) {
  if (tiff.length < 8) return null;
  const order = tiff.toString('latin1', 0, 2);
  if (order !== 'II' && order !== 'MM') return null;
  const u16 = offset => (order === 'II' ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset));
  const u32 = offset => (order === 'II' ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset));
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return null;
  for (let i = 0, count = u16(ifd); i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) break;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return null;
}

// JPEG: APP1-segment met `Exif\0\0`, vóór de start of scan.
function exifOfJpeg(fd) {
  for (let offset = 2; ; ) {
    const head = readAt(fd, offset, 4);
    if (head.length < 4 || head[0] !== 0xff) return null;
    if (head[1] === 0xff) { offset++; continue; } // opvulbyte
    if (head[1] === 0xda || head[1] === 0xd9) return null;
    const length = head.readUInt16BE(2);
    if (length < 2) return null;
    if (head[1] === 0xe1) {
      const payload = readAt(fd, offset + 4, length - 2);
      if (payload.toString('latin1', 0, 6) === 'Exif\0\0') return payload.subarray(6);
    }
    offset += 2 + length;
  }
}

// PNG: `eXIf`-chunk, waar ook vóór IEND.
function exifOfPng(fd) {
  for (let offset = 8; ; ) {
    const head = readAt(fd, offset, 8);
    if (head.length < 8) return null;
    const length = head.readUInt32BE(0);
    const type = head.toString('latin1', 4, 8);
    if (type === 'eXIf') return readAt(fd, offset + 8, length);
    if (type === 'IEND') return null;
    offset += 12 + length;
  }
}

// WebP: `EXIF`-chunk in de RIFF-container, soms met `Exif\0\0` ervoor.
function exifOfWebp(fd) {
  for (let offset = 12; ; ) {
    const head = readAt(fd, offset, 8);
    if (head.length < 8) return null;
    const length = head.readUInt32LE(4);
    if (head.toString('latin1', 0, 4) === 'EXIF') {
      const payload = readAt(fd, offset + 8, length);
      return payload.toString('latin1', 0, 6) === 'Exif\0\0' ? payload.subarray(6) : payload;
    }
    offset += 8 + length + (length % 2);
  }
}

function exifOrientationOf(file) {
  const fd = openSync(file, 'r');
  try {
    const magic = readAt(fd, 0, 12);
    let tiff = null;
    if (magic[0] === 0xff && magic[1] === 0xd8) tiff = exifOfJpeg(fd);
    else if (magic.toString('latin1', 1, 4) === 'PNG') tiff = exifOfPng(fd);
    else if (magic.toString('latin1', 0, 4) === 'RIFF' && magic.toString('latin1', 8, 12) === 'WEBP') tiff = exifOfWebp(fd);
    return tiff ? orientationInTiff(tiff) : null;
  } finally {
    closeSync(fd);
  }
}

function* imagesUnder(dir) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* imagesUnder(path);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) yield path;
  }
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

  const aanvaard = AANVAARD[themeId] ?? [];
  const accepted = problems.filter(p => aanvaard.some(a => a.probleem === p));
  const open = problems.filter(p => !accepted.includes(p));

  const heading = [
    themeId.padEnd(28),
    `beelden ${String(imageCount).padStart(2)}`,
    `figuren ${String(Object.keys(figures).length).padStart(2)}`,
    `video's ${String(Object.keys(videos).length).padStart(2)}`,
    open.length === 0
      ? accepted.length === 0 ? '  in orde' : `  in orde (${accepted.length} aanvaard)`
      : `  ${open.length} probleem/problemen`,
  ].join('  ');
  console.log(heading);

  for (const problem of open) {
    console.log(`    ${problem}`);
  }
  for (const problem of accepted) {
    const reden = aanvaard.find(a => a.probleem === problem).reden;
    console.log(`    ~ ${problem}`);
    console.log(`      ${reden}`);
  }

  // Een aanvaarde regel die niet meer voorkomt, is dode ballast: de bevinding
  // is opgelost of anders geformuleerd. Dat hoort op te vallen.
  for (const a of aanvaard) {
    if (!problems.includes(a.probleem)) {
      open.push(`aanvaarde uitzondering komt niet meer voor — haal hem uit AANVAARD: "${a.probleem}"`);
      console.log(`    ${open[open.length - 1]}`);
    }
  }

  if (open.length > 0) {
    chaptersWithProblems++;
    problemTotal += open.length;
  }
  if (open.length > 0 || accepted.length > 0) console.log('');
}

// ---- Hoofdstukstylesheets (punt 6) ----
// Altijd over alle bestanden, ook als er maar één hoofdstuk gevraagd is: een
// `:root` in welk bestand ook raakt élke hoofdstukpagina.
const stylesheets = existsSync(themeStylesDir)
  ? readdirSync(themeStylesDir).filter(name => name.endsWith('.css')).sort()
  : [];
let stylesheetProblems = 0;

console.log('');
for (const file of stylesheets) {
  const lines = rootSelectorLinesIn(readFileSync(join(themeStylesDir, file), 'utf8'));
  const label = `styles/themes/${file}`.padEnd(28);
  if (lines.length === 0) {
    console.log(`${label}  in orde`);
    continue;
  }
  stylesheetProblems += lines.length;
  console.log(`${label}  ${lines.length} probleem/problemen`);
  for (const line of lines) {
    console.log(`    regel ${line}: \`:root\` — scope de regel onder html[data-theme="<id>"] (#120)`);
  }
}

// ---- Beeldoriëntatie (punt 7) ----
// Altijd over alle beelden: de mappen onder public/images/ lopen niet één op
// één gelijk met de hoofdstuk-id's.
const images = existsSync(imagesDir) ? [...imagesUnder(imagesDir)] : [];
const orientationProblems = [];

for (const file of images) {
  const path = relative(projectRoot, file).split(sep).join('/');
  let orientation;
  try {
    orientation = exifOrientationOf(file);
  } catch (error) {
    orientationProblems.push(`${path}: kop niet te lezen — ${error.message}`);
    continue;
  }
  if (orientation !== null && orientation !== 1) {
    orientationProblems.push(
      `${path}: EXIF-oriëntatie ${orientation} — roteer de pixels (sharp().rotate() zonder argument) en schrijf zonder tag (#70)`
    );
  }
}

console.log('');
const imagesLabel = 'public/images/'.padEnd(28);
console.log(
  orientationProblems.length === 0
    ? `${imagesLabel}  ${images.length} beeld(en), oriëntatie in orde`
    : `${imagesLabel}  ${orientationProblems.length} probleem/problemen`
);
for (const problem of orientationProblems) {
  console.log(`    ${problem}`);
}

console.log('');
if (chaptersWithProblems === 0 && stylesheetProblems === 0 && orientationProblems.length === 0) {
  const aanvaardTotaal = Object.values(AANVAARD).flat().length;
  const geheel = `Alle ${themes.length} hoofdstuk(ken), ${stylesheets.length} stylesheet(s) en ${images.length} beeld(en) in orde`;
  console.log(
    aanvaardTotaal === 0
      ? `${geheel}.`
      : `${geheel} — ${aanvaardTotaal} aanvaarde uitzondering(en), zie AANVAARD in dit script.`
  );
  process.exit(0);
}

const summary = [];
if (chaptersWithProblems > 0) {
  summary.push(`${problemTotal} probleem/problemen in ${chaptersWithProblems} van ${themes.length} hoofdstuk(ken)`);
}
if (stylesheetProblems > 0) {
  summary.push(`${stylesheetProblems} \`:root\` in src/styles/themes/`);
}
if (orientationProblems.length > 0) {
  summary.push(`${orientationProblems.length} beeld(en) met een EXIF-oriëntatie ≠ 1 onder public/images/`);
}
console.log(`${summary.join('; ')}.`);
process.exit(1);
