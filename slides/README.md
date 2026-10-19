# Slides

Per-thema klassikale presentaties, gebouwd met [Slidev](https://sli.dev).
Elke deck wordt gepubliceerd onder `/cursus-esthetica/slides/<theme-id>/`
op dezelfde GitHub Pages-site als de cursus.

## Structuur

```
slides/
  theme/
    manifest/  contrapunctus/  aigles/           # één Slidev-thema per hoofdstuk
    oculus/    penumbra/       pagina37/
    layouts-base/                        # gedeeld addon met extra layouts
  <theme-id>/slides.md            # één map per deck
  build-all.mjs                   # bouwt alle decks naar dist/slides/<id>/
  tsconfig.json                   # typecheck van theme/ voor `npm run check:vue`
  types/slidev-client.d.ts        # de types van @slidev/client voor die check
```

## Thema's en de gedeelde layouts

Elk hoofdstuk krijgt zijn **eigen visuele thema** onder `theme/` — het draagt de
sfeer van dat hoofdstuk, niet die van de vorige les. Daarnaast trekt een deck het
**`layouts-base`-addon** binnen voor de gedeelde extra layouts (`compare`,
`duet`, `triptych`, `detail`, `paired-reveal`, `quadrants`, `breathe`, `scale`,
`spotlight`) en de videocomponenten:

```yaml
---
theme: ../theme/manifest
addons:
  - ./theme/layouts-base
---
```

`duet` is de fragment-tegenhanger van `compare`: twee `CourseVideoInline`-spelers
naast elkaar met een label per kant, declaratief in de frontmatter, plus een slot
voor de vraag erboven.

```yaml
---
layout: duet
left:  { id: meerstemmigheid/leonin,  label: "Léonin · ca. 1170 · twee stemmen" }
right: { id: meerstemmigheid/perotin, label: "Pérotin · ca. 1200 · vier stemmen" }
---

## Viderunt omnes · twee keer
```

De spelers zijn breedte-gebonden en dus kleiner dan één enkele speler; dat is de
prijs van gelijktijdigheid. `slides/check-coverage.mjs` leest deze twee id's uit
de frontmatter mee, zodat een fragment dat alleen in een `duet` staat gewoon
meetelt in de dekking.

> **Let op de paden.** `theme:` wordt door Slidev resolved t.o.v. de map
> van `slides.md` zelf (vandaar `../`), maar `addons:` t.o.v. de parent
> van die map — voor decks in `slides/<id>/` is dat dus `slides/`. Het
> verschil in `../` vs `./` is opzettelijk.

### Tokens-contract voor nieuwe thema's

`layouts-base/styles/layouts.css` is bewust kleur- en font-loos en leest
enkel tokens uit het actieve thema. Een nieuw thema moet minstens deze
custom properties op `:root` definiëren wil het addon correct renderen:

| Token | Gebruikt voor |
|---|---|
| `--color-text`, `--color-text-quiet` | meta-regel in quadrant, labels en assen in scale, labels in spotlight |
| `--color-accent`, `--color-bg` | aanwijslijn in scale; zone-omlijning, labelstrook en bijschriftstrook in spotlight |
| `--color-rule` *(optioneel)* | randen rond quadrants, detail-uitsneden en paired-reveal-beeld — valt terug op `--color-text` |
| `--space-sm`, `--space-md`, `--space-lg`, `--space-xl` | gaps en padding |
| `--font-mono`, `--step--1` | meta-regel in quadrant, bijschriften in triptych en detail, labels in duet |
| `--breathe-from`, `--breathe-to` *(optioneel)* | begin- en eindkleur van de grond onder `layout: breathe`; optioneel `--breathe-via-1` / `--breathe-via-2` voor de tussenstanden en `--breathe-duration` (standaard 75s). Zonder deze tokens staat de grond stil op `--color-bg` — geen effect in plaats van een verkeerd effect |
| `--magnify-*` *(optioneel)* | de beweging en maat van het inzoomen (`magnify: true`, zie hieronder); zonder deze tokens een neutrale groei van 450 ms |

### Inzoomen per klik: `magnify: true`

Op een slide met meer dan één beeld zet `magnify: true` in de frontmatter elk
beeld om de beurt groot (#170). Het werkt op `triptych`, `compare` en `detail`,
en op elke thema-layout die het gedeelde stuk gebruikt (in `legering`:
`vitrine`, `tussenstand`, `boven-beneden`).

```yaml
---
layout: triptych
class: deco
magnify: true
images: [ … ]
captions: [ … ]
---
```

- **Klik 0** — het overzicht, zoals zonder `magnify`.
- **Klik 1 … n** — beeld k zo groot als de slide toelaat (`contain`, niets
  bijgesneden), zonder bijschrift; de andere beelden staan als smalle strook
  aan de rechterrand, het vergrote gemarkeerd.
- **Klik n + 1** — terug naar het overzicht. Een `v-click` in de slot-inhoud
  komt daarna (op de tussenstand: de vraag op klik 4).

De sleutel heet niet `zoom`: die naam is van Slidev zelf (`zoom: 0.8` schaalt de
inhoud van een slide). `magnify` vervangt `reveal`; staan ze allebei aan, dan
staat het overzicht er meteen volledig. Een slide zonder `magnify` verandert
niet: geen extra klikken, geen extra DOM.

Het mechanisme zit in `layouts-base`: `useMagnify` in `utils.ts` (klikstappen,
registratie via `useOwnClicks` met `leading`, de staat) en
`parts/MagnifyLayer.vue` (het vergrote beeld, de strook, de beweging). De layout
zet `data-magnify="k"` op zijn root (k = het vergrote beeld, `0` = overzicht) en
`--magnify-step` (de klikstand); een eigen layout markeert de plek van beeld i
in het overzicht met `data-magnify-source="i"`, zodat het beeld daaruit groeit.

Hoe het beweegt bepaalt het thema, met tokens die op het vergrote kader erven
(van de slide, of van een registerklasse op het kader zelf):

| Token | Standaard | Waarvoor |
|---|---|---|
| `--magnify-keyframes`, `--magnify-duration`, `--magnify-easing` | `layouts-base-magnify-grow`, 450ms, ease-out | inzoomen; de keyframes lezen `--magnify-dx` / `-dy` / `-s`, de plek waar het beeld vandaan komt, en zetten `--magnify-open` van 0 naar 1 |
| `--magnify-leave-keyframes`, `-duration`, `-easing` | `layouts-base-magnify-shrink`, 300ms, ease-in | uitzoomen, naar de strook of terug naar het overzicht |
| `--magnify-fade-duration`, `--magnify-fade-easing` | 300ms, ease | het overzicht dat wijkt, de strook die inschuift |
| `--magnify-inset` | `--space-md` | afstand tot de rand van de slide |
| `--magnify-bleed` | 0px | ruimte rond het beeld voor een kader dat het thema tekent |
| `--magnify-strip-width`, `--magnify-strip-gap` | 5.5rem, `--space-md` | de strook |
| `--magnify-thumb-dim` | 0.4 | dekking van de niet-actieve kleine beelden |

Een animatie eindigt altijd op `transform: none` (fill `backwards`): het beeld
staat op zijn echte maat in de DOM en wordt na de beweging op die maat
gerasterd, dus het blijft niet wazig zoals een vergroting die op `scale()`
eindigt. `legering` zet per register eigen keyframes en een kader rond het
vergrote beeld (`--magnify-ring-*`, `--magnify-lip-*`); zie het blok *Inzoomen
per klik* in `theme/legering/styles/layout.css`.

Het basis-tokenset (`--color-bg`, `--color-text`, typografie-stapel,
spacing-stapel, `--step-*`, `--slidev-*`-hooks) hoort sowieso in elk thema —
zie `theme/manifest/styles/layout.css` als referentie-implementatie.

Een deck bestaat zodra `slides/<theme-id>/slides.md` bestaat. De
`slides →`-knop op de ThemeCard verschijnt automatisch zodra het bestand er
staat (zie `src/lib/has-slides.ts`).

## Werken aan een deck

```bash
npx slidev slides/licht-en-schaduw/slides.md
```

Opent de dev-server op http://localhost:3030. Presenter-modus zit op
`/presenter`. Sprekersnotities in HTML-comments na elk slide.

De `siteAssetsPlugin` uit `vite.config.ts` laat Vite in dev ook
`@fix-webm-duration/fix` voorbundelen (CommonJS, uit Slidevs opnamefunctie).
Zonder dat logt Slidev 52.15 bij elke paginalading `does not provide an export
named 'fixWebmDuration'` (#105). Vanaf Slidev 52.17.0 is dat niet meer nodig; de
upgrade staat in #161.

## Bouwen

`npm run build` bouwt eerst de Astro-site, dan alle decks. Slidev-output
gaat naar `dist/slides/<theme-id>/` met `--base /cursus-esthetica/slides/<id>/`
zodat hashed assets correct laden onder de GitHub Pages subpath.

Alleen decks bouwen:

```bash
npm run build:slides
```

## Typecheck

```bash
npm run check:vue
```

`vue-tsc` in strict mode, met `strictTemplates`, over alle `.vue` en `.ts` onder
`theme/` en de `vite.config.ts` van elk deck (`slides/tsconfig.json`). De build
doet dat niet: `slidev build` compileert templates zonder typecontrole. De
root-`tsconfig.json` sluit `slides/` uit, zodat `astro check` alleen de site
controleert. CI draait beide.

`@slidev/client` wordt in deze check niet uit het pakket getypeerd: dat levert
ruwe `.ts`-bron die alleen in Slidevs eigen monorepo typecheckt (globals als
`__DEV__`, een ongetypeerde `file-saver`). `types/slidev-client.d.ts` declareert
wat de layouts gebruiken, met de echte types uit `@slidev/types`, plus de
Slidev-directives en -componenten die zonder import in de templates staan
(`v-click`, `<v-clicks>`). Gebruikt een layout iets wat daar nog niet staat, dan
wordt de check rood; voeg het daar toe. De build ziet dat bestand niet.

## Een nieuw deck toevoegen

1. Maak `slides/<theme-id>/slides.md` aan met headmatter:
   ```yaml
   ---
   theme: ../theme/<theme-name>
   addons:
     - ./theme/layouts-base
   ---
   ```
   (de `addons:`-regel weglaten als je de extra layouts niet nodig hebt).
   Zie de noot hierboven over `../` (theme) vs `./` (addons).
2. Voeg `slides/<theme-id>/vite.config.ts` toe zodat het deck de
   afbeeldingen uit `public/images/` van de site kan gebruiken zonder
   duplicatie:
   ```ts
   import { defineConfig } from 'vite';
   import { siteAssetsPlugin } from '../theme/dev-site-public';

   export default defineConfig({
     plugins: [siteAssetsPlugin()],
   });
   ```
3. `npx slidev slides/<theme-id>/slides.md` om interactief te schrijven.
4. Commit. De `slides →`-knop op de bijbehorende ThemeCard verschijnt
   automatisch bij de volgende build.

## Afbeeldingen referencen

Verwijs naar bestaande site-assets met hun volledige deploy-pad:

```yaml
layout: image
image: /cursus-esthetica/images/<theme-id>/foo.jpg
```

In productie staan deck en site op dezelfde origin onder
`/cursus-esthetica/`, dus die paden resolven naar de Astro-image. In dev
serveert de `siteAssetsPlugin` uit `vite.config.ts` hetzelfde pad vanuit
`public/` van de site. Resultaat: één set bytes op disk, in git, én in
`dist/` — geen `slides/<id>/public/img/` meer nodig.

Cross-theme hergebruik werkt zonder kopiëren: het inleiding-deck verwijst
bijvoorbeeld naar `/cursus-esthetica/images/licht-en-schaduw/flavin-1.png`.

### Waarom dit werkt onder een afwijkende deck-base

Slidev/Vite prefixen `BASE_URL` (= `/cursus-esthetica/slides/<id>/`) aan
elk pad dat met `/` start. Voor paden die *al* absoluut zijn t.o.v. de
site (`/cursus-esthetica/...`) zou dat een dubbele prefix opleveren. Twee
mechanismen voorkomen dat:

1. **Override-layouts in `theme/layouts-base/`.** `image.vue`,
   `image-right.vue`, `image-left.vue`, `compare.vue`, `triptych.vue`,
   `detail.vue`, `breathe.vue`, `scale.vue`, `spotlight.vue` en
   `paired-reveal.vue` gebruiken een lokale
   `resolveAsset` die paden onder `/cursus-esthetica/` ongewijzigd doorlaat.
   Slidev's eigen `image`/`image-right`-layouts worden zo automatisch
   overschreven door het addon. Elke eigen layout die een beeldpad verwerkt —
   ook een thema-eigen zoals `raking` of `dimmer` in `penumbra` — moet
   diezelfde `resolveAsset` gebruiken.
2. **Post-build rewrite in `build-postprocess.mjs`.** Slidev genereert ook
   `<link rel="preload">`-tags in `index.html` via z'n interne resolver,
   buiten de layouts om. `build-all.mjs` draait na elke deck-build een
   tekstreplace die `/<deck-base>/cursus-esthetica/` terugzet naar
   `/cursus-esthetica/`.
