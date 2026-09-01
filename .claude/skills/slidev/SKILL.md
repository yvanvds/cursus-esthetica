---
name: slidev
description: Bouw of werk een Slidev-deck bij voor deze cursus esthetica — de klassikale presentatie bij een hoofdstuk, onder slides/<theme-id>/slides.md. Gebruik dit bij elk issue met label `slides`, en bij vragen als "maak een deck voor hoofdstuk X", "de presentatie mist de video's", "bouw een layout voor deze slide", of "dit deck volgt het hoofdstuk niet". Legt vast waarvoor een deck dient (de lesdraad van de docent), hoe het de bewegingen van het hoofdstuk volgt, dat alle beelden en video's uit de cursustekst mee moeten, dat elk hoofdstuk een eigen visueel thema krijgt, en welke projecttechniek (layouts-base, CourseVideo, siteAssetsPlugin, padgedrag) niet in de upstream-documentatie staat.
---

# Slidedecks voor deze cursus

Elk hoofdstuk heeft een klassikale presentatie onder `slides/<theme-id>/slides.md`,
gepubliceerd op `/cursus-esthetica/slides/<theme-id>/`. Dit document beschrijft
wat zo'n deck moet zijn. De techniek eromheen — mappen, paden, build — staat in
`slides/README.md`; hieronder alleen wat je bij het schrijven nodig hebt.

## 1 — Waarvoor een deck dient

**Het deck is de lesdraad van de docent.** Het staat er om ervoor te zorgen dat er
tijdens de les geen deel van het verhaal wordt overgeslagen, en dat niets te snel
wordt afgeraffeld omdat de docent het al kent.

Het is **geen samenvatting van het hoofdstuk voor de leerling**. Dat hoofdstuk
staat al op de site, in betere zinnen dan op een slide passen. Een deck dat de
cursustekst overschrijft is dubbel werk dat bij elke tekstwijziging uit elkaar
loopt.

Twee gevolgen voor de vorm:

- **De sprekersnotities zijn het script, niet de decoratie.** Wat er verteld
  wordt hoort in de `<!-- -->`-notitie onder de slide: de anekdote, het jaartal,
  de vraag aan de klas, de valkuil. Bekijk `slides/inleiding/slides.md` — de
  notities dragen daar het grootste deel van de les.
- **De slide toont wat de klas moet zien.** Beeld, een fragment, vier woorden,
  een vergelijking. Geen alinea's. Kan de slide zonder de docent gelezen worden,
  dan staat er te veel op.

Schrijf de notitie in de tweede persoon tegen de docent ("houd ze stil", "niet
voorzeggen — eerst de klas laten praten"), niet als een verslag van wat de slide
toont.

## 2 — Het deck volgt de bewegingen van het hoofdstuk

Elke `##` in de MDX wordt een sectieslide `# N — <beweging>`. Dat is geen
formaliteit: het is wat maakt dat je tijdens de les weet waar je bent, en het is
de reden dat het hoofdstuk en het deck niet uit elkaar lopen.

De bestaande decks doen dit al: inleiding 5 van 5 bewegingen, meerstemmigheid
7 van 7, belgisch-experiment 6 van 7.

**Bewust afwijken mag, per ongeluk niet.** Meerstemmigheid opent met een extra
`0 — Een gouden plaat` die in het hoofdstuk niet als kop staat — dat is winst,
een concreet anker vóór de theorie. Belgisch-experiment laat de openingsbeweging
`Vijf namen` wegvallen — dat is verlies, want de rest van de les slaat erop
terug. Als je afwijkt, zeg dan in de PR waarom.

**Omvang volgt het hoofdstuk, niet de klok.** Er is geen richtgetal voor het
aantal slides en geen poging om een deck op één lesuur te snijden. Een deck dekt
het hele hoofdstuk; hoe ver je in een lesuur komt, beslis je in de klas. De
bewegingen zijn de natuurlijke pauzepunten.

**De slotslide volgt uit de collectie, niet uit je geheugen.** `layout: end` met
"Volgende keer" noemt het volgende hoofdstuk: dat is het thema met de eerstvolgende
`order` binnen dezelfde module (`src/content/modules/<module>.md` heeft zelf een
`order`, `src/content/themes/*.mdx` ook). Zoek het op vóór je het opschrijft — dit
is drie keer op drie fout gegaan, één keer naar een hoofdstuk dat niet bestaat.

## 3 — Alles wat het hoofdstuk toont, toont het deck ook

**Elke `figures:`-key en elke `videos:`-key uit de frontmatter van het hoofdstuk
komt minstens één keer in het deck.** Dit is de regel waar het in de praktijk
lekt:

| deck | beelden | video's |
|---|---|---|
| inleiding | 9/10 | 4/4 |
| meerstemmigheid | 12/16 | 5/8 |
| belgisch-experiment | 21/29 | 2/2 |

En het lekt niet willekeurig. Het zijn de **figuurgroepen met meerdere beelden**
die tot één worden teruggebracht: Rosetta 1 van 3, Art Farm 1 van 3, de
Logos-robots 0 van 3. Zo'n gat valt bij het doorklikken niet op — een reeks
waarvan één beeld in het deck staat, ziet er compleet uit. Alleen tellen vindt
het.

Dus: **een figuurgroep met meerdere beelden wordt niet tot één beeld
gereduceerd.** `compare`, `triptych`, `paired-reveal` en `quadrants` bestaan
precies daarvoor.
Staan er drie beelden in de groep, dan is de vraag welke layout die drie draagt —
niet welk beeld het beste is.

Bij meerstemmigheid ontbreken `chakrulo`, `erraji` en `perotin`: dat zijn geen
illustraties maar de luistervoorbeelden zelf, in een hoofdstuk dat over horen
gaat. Een ontbrekende video is daarom zwaarder dan een ontbrekend beeld — zonder
die drie kan je de les wel geven, maar niet laten horen.

**Tel het na voor je de PR opent, en zet de telling in de PR-body.** Handmatig
doorklikken werkt niet: bij belgisch-experiment gaat het om 29 beelden over 96
slides. Tel daarom met `npm run check:slides` (één deck:
`npm run check:slides -- <theme-id>`). Dat rapporteert per figuurgroep — `rosetta
1/3` — precies omdat een reeks waarvan één beeld in het deck staat er compleet
uitziet. Plak de uitvoer voor je deck in de PR-body. Het script breekt de build
niet en zit niet in `npm run build`; het geeft alleen exitcode 1 zolang er iets
ontbreekt.

**Extra lesmateriaal mag erbij.** Wat om rechtenredenen niet in de cursustekst
kan maar in een les wel verantwoord is (SMOLE, beschermd beeld) hoort thuis in
het deck. Zie `docs/REDACTIE.md` — dat document geldt ook voor decks, inclusief
de afspraken over register, leenwoorden en lange video's.

**Een deck-eigen beeld staat wél bij de andere beelden, maar niet in
`figures:`.** Mist het deck een beeld dat het hoofdstuk niet heeft — het
stichtende werk van een beweging, een buitenaanzicht dat een vergelijking
afmaakt — dan zoek je het en zet je het als bestand onder
`public/images/<theme-id>/`, precies zoals elk ander beeld, en verwijs je
ernaar met het volledige deploy-pad. Zet het **niet** in de `figures:` van het
hoofdstuk: elke key daar hoort minstens één keer in de body van de MDX gebruikt
te worden, en de body aanpassen is werk voor een `hoofdstuk`-issue, niet voor
een `slides`-issue. De dekkingscheck telt alleen de keys uit `figures:`, dus een
extra beeld verstoort de telling niet.

Daar zit één probleem aan: **zo'n beeld heeft geen frontmatter om zijn `source:`
in te zetten.** De bron hoort dan in de sprekersnotitie van de slide waar het
staat — één regel, met maker, jaar en licentie, geformuleerd zodat de docent hem
kan voorlezen als iemand het vraagt. `sources.json` naast het bestand krijgt zijn
entry sowieso via de image-downloader, maar dat bestand komt niet mee de les in.
Noem in de PR-body welke beelden deck-eigen zijn en waar hun bron staat.

## 4 — Elk hoofdstuk krijgt een eigen visueel thema

Zo zijn we begonnen en zo gaan we door. Het thema draagt de sfeer van dít
hoofdstuk, niet die van de vorige les.

| thema | deck |
|---|---|
| `manifest` | inleiding |
| `contrapunctus` | meerstemmigheid |
| `aigles` | belgisch-experiment |
| `oculus` | perspectief-en-ruimte |
| `penumbra` | licht-en-schaduw |

Een nieuw deck betekent normaal een nieuw thema onder `slides/theme/<naam>/`:

```
slides/theme/<naam>/
  package.json          # name: slidev-theme-<naam>, keywords: ["slidev-theme", "slidev"]
  styles/index.ts       # import '@slidev/client/styles/layouts-base.css' + './layout.css'
  styles/layout.css     # de tokens en de vorm
```

`layouts-base/styles/layouts.css` is bewust kleur- en fontloos en leest alleen
tokens uit het actieve thema. Een thema dat die tokens niet zet, breekt de
gedeelde layouts stil. Het contract staat in `slides/README.md` §
*Tokens-contract voor nieuwe thema's* — minstens `--color-text`,
`--color-text-quiet`, `--space-sm/md/lg/xl`, `--font-mono`, `--step--1`, plus
optioneel `--color-rule`.

`--color-rule` is optioneel in de code (`layouts.css` regels 31 en 83 schrijven
`var(--color-rule, var(--color-text))`), maar bij een donker thema is die
fallback een lichte rand rond elk quadrant en rond het paired-reveal-beeld. Zet
hem daar dus altijd. In de praktijk bijt dit nu nergens — alle vier de bestaande
thema's definiëren `--color-rule` al — maar het is de val die op je wacht zodra
je hem vergeet.

Startpunt voor de sfeer is de `accentColor` en het `customStyles`-bestand van het
hoofdstuk zelf (`src/styles/themes/<theme-id>.css`). Het deck en de
hoofdstukpagina horen herkenbaar familie te zijn, zonder dezelfde CSS te delen —
de site gebruikt `src/styles/tokens.css`, het deck zijn eigen thema.

## 5 — Een nieuwe layout maken is de normale reflex

Dit is een cursus over kunst. De slides mogen dat laten zien, en de gedeelde
layouts zijn er niet om je binnen te houden.

Wat er nu is in `slides/theme/layouts-base/layouts/`:

| layout | waarvoor |
|---|---|
| `image` | één beeld, volle slide (`backgroundSize: contain` voor werken) |
| `image-left` / `image-right` | beeld naast tekst |
| `compare` | twee beelden naast elkaar, `left:` en `right:` |
| `triptych` | drie (of twee/vier) beelden op één rij, `images:` + optioneel `captions:`, `reveal: true` voor één per klik |
| `detail` | één werk groot (`image:`) plus zijn uitsneden (`details:`) — voor een figuurgroep die geen drie werken is maar een werk plus crops |
| `paired-reveal` | tekststappen links, wisselend beeld rechts — per klik het volgende beeld uit `images:` |
| `quadrants` | vier vakken, `::q1::` t/m `::q4::` |
| `breathe` | full-bleed beeld op een grond die traag van kleur verschuift, één beeld per klik; leest `--breathe-from` / `--breathe-to` uit het thema |

Vraagt een beweging om iets anders — een tijdlijn, een detail dat in het geheel
schuift, een overlay, een partituurstrook onder een fragment, drie beelden in
plaats van twee — dan **bouw je die layout**. Niet: de beweging platslaan tot wat
`compare` toevallig kan.

Waar hij hoort:

- **Gedeeld gedrag → `layouts-base/layouts/`.** Iets wat elk deck kan gebruiken.
  Zet de vorm-neutrale CSS in `layouts-base/styles/layouts.css` en gebruik alleen
  tokens, geen kleuren of fonts.
- **Thema-eigen vorm → het thema zelf.** Iets wat alleen bij dít hoofdstuk hoort,
  in `slides/theme/<naam>/`.

Drie dingen om niet mis te doen in een eigen layout:

1. **Beeldpaden door `resolveAsset()`.** Elke layout die een `image`-prop
   verwerkt moet `resolveAsset` uit `../utils` gebruiken. Slidev prefixt anders
   `BASE_URL` (`/cursus-esthetica/slides/<id>/`) vóór een pad dat al absoluut is
   t.o.v. de site, en dan laadt het beeld niet. Dat is de reden dat `image.vue`,
   `image-left.vue`, `image-right.vue`, `compare.vue` en `paired-reveal.vue`
   Slidevs eigen layouts overschrijven.
2. **De layout zet zijn eigen naam als klasse op zijn root.** Slidev doet dat
   niet voor je. Elke layout in `layouts-base/` en elke thema-eigen layout doet
   het nu — `<div class="slidev-layout triptych">`, `… image">`, `… breathe">` —
   en een nieuwe layout hoort dat ook te doen. Vergeet je het, dan grijpt élke
   themaregel op `.slidev-layout.<naam>` niets: geen buildfout, geen
   waarschuwing, alleen een slide die er anders uitziet dan bedoeld. Dat is
   precies wat er maandenlang misging bij `image`, `image-left` en
   `image-right` (#49).

   De niet-vanzelfsprekende helft: bij **`image-left` en `image-right` staat de
   klasse op de teksthelft**, niet op de grid-wrapper eromheen. Die wrapper is
   geen `.slidev-layout` en kan dus door geen enkele themaregel geraakt worden;
   de beeldhelft evenmin, en die hoort ook geen thema-chroom te dragen. Richt
   een themaregel voor die layouts dus op de teksthelft, en gebruik géén
   `[class*="image-"]`-vangnet om `image` en `image-left/-right` in één regel te
   pakken — dat treft de teksthelft mee.
3. **Geen registratie nodig, wel bewijs dat het werkte.** Slidev laadt
   `layouts/` en `components/` van een addon automatisch. Een layout of component
   die níét gevonden wordt geeft **geen buildfout** — alleen een stille
   runtime-waarschuwing en een lege plek. Open het deck dus altijd echt.

## 6 — Video's

Nooit een YouTube-embed met de hand in een slide. Gebruik de componenten uit
`layouts-base/components/`; die lezen `videos.generated.json`, dat
`npm run sync:videos` uit de frontmatter van de hoofdstukken haalt. Zo staan
YouTube-id en tijdcodes op één plaats — in de cursustekst — en spelen deck en
site hetzelfde fragment.

```md
<CourseVideo id="inleiding/beethoven" label="Beethoven, 5e symfonie" />
<CourseVideoInline id="meerstemmigheid/leonin" style="width: 60%;" />
```

- `CourseVideo` — klikbare titel, speelt fullscreen in een overlay. De standaard.
- `CourseVideoInline` — speelt op de slide zelf. Voor wanneer het beeld naast
  iets anders moet staan (een partituur, een tweede fragment) en wegklikken naar
  een overlay het punt kapotmaakt.
- `id` is `<theme-id>/<video-key>`. Staat de key er niet in, dan rendert de
  component zichtbaar `Onbekend fragment: <id>` in het rood — dat is opzet, zodat
  een typo in de les niet als lege plek verschijnt.
- `label` weglaten en de titel uit de cursustekst wordt gebruikt.

Voeg je een video toe aan een hoofdstuk, draai dan `npm run sync:videos` voor je
het deck opent. `npm run build:slides` doet dat zelf.

## 7 — Projecttechniek

Kort; het volledige verhaal staat in `slides/README.md`.

```yaml
---
theme: ../theme/<naam>          # resolved t.o.v. slides/<id>/ → vandaar ../
addons:
  - ./theme/layouts-base        # resolved t.o.v. slides/ → vandaar ./
title: <titel van het hoofdstuk>
info: |
  Cursus Esthetica — hoofdstuk NN
  <shortDescription>
routerMode: hash
---
```

Het verschil tussen `../` en `./` op die twee regels is geen typo.

**`routerMode: hash` is verplicht, niet optioneel.** GitHub Pages heeft geen
SPA-rewrite, dus in de standaard history-modus bestaat alleen de index van een
deck: `/slides/<id>/2` en `/slides/<id>/presenter` geven allebei 404. Die tweede
is de fatale — in dit project staat de hele les in de sprekersnotities (§1), en
die zijn alleen via `/presenter` te zien. Een F5 midden in de les is dan ook het
einde van de les.

Geen enkele gate vangt dit: de build is groen mét en zonder, en lokaal in
`npx slidev` werkt history-modus prima. Alleen de gedeployde site breekt. Het
inleiding-deck heeft daar maanden zonder gestaan (#46).

Elk deck heeft daarnaast `slides/<theme-id>/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { siteAssetsPlugin } from '../theme/dev-site-public';

export default defineConfig({ plugins: [siteAssetsPlugin()] });
```

Zonder dat bestand laden de site-beelden niet in dev. Beeldpaden zijn altijd het
volledige deploy-pad, `/cursus-esthetica/images/<theme-id>/<bestand>` — één set
bytes op disk, geen kopieën onder `slides/`. Cross-theme hergebruik mag: het
inleiding-deck gebruikt een beeld uit `licht-en-schaduw`.

Een deck bestaat zodra `slides/<theme-id>/slides.md` er staat: `src/lib/has-slides.ts`
zet dan de `slides →`-knop op de ThemeCard. **Er is dus geen concept-toestand.**
Een half deck committen betekent een half deck op de live site.

## 8 — Werkwijze bij een deck-issue

Volg `work-issues`. Daarbovenop:

**Checkpoint: de slide-outline vóór het uitschrijven.** Toon in één blok:

- de bewegingen met per beweging wat er te zien is en wat de docent doet;
- waar elke figuurgroep en elke video landt (dat is meteen je dekkingstelling);
- bij een nieuw deck: het themavoorstel, als één uitgewerkte slide in plaats van
  een beschrijving;
- de layouts die je wil bouwen, met wat ze moeten kunnen.

Dat is één stop, niet vier. Verzamel de kleine vragen tot dat blok.

**Verificatie.** `npm run build:slides` groen is niet genoeg — dat bewijst dat het
bouwt, niet dat het klopt. Open het deck met `npx slidev slides/<theme-id>/slides.md`
en klik het door:

- laadt elk beeld (een mislukt pad geeft geen buildfout);
- rendert elke eigen layout en component (een niet-gevonden component geeft geen
  buildfout, alleen een lege plek);
- speelt elk fragment, met de juiste starttijd;
- klopt de dekkingstelling met de frontmatter van het hoofdstuk;
- noemt de slotslide het juiste volgende hoofdstuk.

**Die render-check vraagt een scherm.** Er is geen headless alternatief in dit
project: `slidev export` heeft `playwright-chromium` nodig en dat zit niet in de
dependencies (toevoegen is een aparte afweging, doe dat niet en passant). Werk je
zonder scherm, dan sla je de check niet stil over — je meldt in de PR expliciet
wat je wél en niet hebt kunnen vaststellen, en je toont per nieuwe layout en
component bewijs uit de gebouwde bundel: een eigen chunk met de scoped klassen
erin (`.triptych-panel`, `.vp-rays`) en nul `resolveComponent(...)` in `dist/`.
Een niet-gevonden layout laat precies dat achterwege, dus het onderscheid is
hard. Wat het níét bewijst is of het er goed uitziet; zeg dat er dan ook bij.

Zet de echte uitkomsten in de PR-body, inclusief de telling vóór en na.

## Naslag

`slides/README.md` — mappen, paden, build, tokens-contract, waarom de
post-build-rewrite bestaat.

`references/` — upstream Slidev-documentatie, gesnoeid tot wat hier van
toepassing is. De developer-features (Monaco, twoslash, magic-move, code-groups,
PlantUML, editor-integraties) zijn eruit; die gebruiken we niet.

| onderwerp | bestand |
|---|---|
| slide-syntaxis, scheidingstekens, notities | [core-syntax](references/core-syntax.md) |
| klikanimaties, `v-click`, transities | [core-animations](references/core-animations.md) |
| headmatter (deckbreed) | [core-headmatter](references/core-headmatter.md) |
| frontmatter (per slide) | [core-frontmatter](references/core-frontmatter.md) |
| ingebouwde layouts | [core-layouts](references/core-layouts.md) |
| ingebouwde componenten | [core-components](references/core-components.md) |
| layout-slots (`::right::`) | [layout-slots](references/layout-slots.md) |
| globale lagen | [layout-global-layers](references/layout-global-layers.md) |
| versleepbare elementen | [layout-draggable](references/layout-draggable.md) |
| canvasgrootte, zoom, schalen | [layout-canvas-size](references/layout-canvas-size.md), [layout-zoom](references/layout-zoom.md), [layout-transform](references/layout-transform.md) |
| scoped CSS in een slide | [style-scoped](references/style-scoped.md) |
| iconen | [style-icons](references/style-icons.md) |
| markeerstift-effect (`v-mark`) | [animation-rough-marker](references/animation-rough-marker.md) |
| tekenen tijdens de les | [animation-drawing](references/animation-drawing.md) |
| richting-afhankelijke animatie | [style-direction](references/style-direction.md) |
| presentermodus, timer, afstandsbediening | [presenter-timer](references/presenter-timer.md), [presenter-remote](references/presenter-remote.md), [presenter-recording](references/presenter-recording.md) |
| `[click]` in een sprekersnotitie | [animation-click-marker](references/animation-click-marker.md) |
| slides importeren, frontmatter samenvoegen | [syntax-importing-slides](references/syntax-importing-slides.md), [syntax-frontmatter-merging](references/syntax-frontmatter-merging.md), [syntax-block-frontmatter](references/syntax-block-frontmatter.md) |
| thema ejecten | [tool-eject-theme](references/tool-eject-theme.md) |
| CLI, export, hosting | [core-cli](references/core-cli.md), [core-exporting](references/core-exporting.md), [core-hosting](references/core-hosting.md) |
| build: pdf, remote assets, og-image, seo | [build-pdf](references/build-pdf.md), [build-remote-assets](references/build-remote-assets.md), [build-og-image](references/build-og-image.md), [build-seo-meta](references/build-seo-meta.md) |
| LaTeX, mermaid | [diagram-latex](references/diagram-latex.md), [diagram-mermaid](references/diagram-mermaid.md) |
| `$nav`, composables, slide-hooks | [core-global-context](references/core-global-context.md), [api-slide-hooks](references/api-slide-hooks.md) |
