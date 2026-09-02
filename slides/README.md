# Slides

Per-thema klassikale presentaties, gebouwd met [Slidev](https://sli.dev).
Elke deck wordt gepubliceerd onder `/cursus-esthetica/slides/<theme-id>/`
op dezelfde GitHub Pages-site als de cursus.

## Structuur

```
slides/
  theme/
    manifest/  contrapunctus/  aigles/           # één Slidev-thema per hoofdstuk
    oculus/    penumbra/
    layouts-base/                        # gedeeld addon met extra layouts
  <theme-id>/slides.md            # één map per deck
  build-all.mjs                   # bouwt alle decks naar dist/slides/<id>/
```

## Thema's en de gedeelde layouts

Elk hoofdstuk krijgt zijn **eigen visuele thema** onder `theme/` — het draagt de
sfeer van dat hoofdstuk, niet die van de vorige les. Daarnaast trekt een deck het
**`layouts-base`-addon** binnen voor de gedeelde extra layouts (`compare`,
`duet`, `triptych`, `detail`, `paired-reveal`, `quadrants`, `breathe`) en de
videocomponenten:

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
| `--color-text`, `--color-text-quiet` | meta-regel in quadrant |
| `--color-rule` *(optioneel)* | randen rond quadrants, detail-uitsneden en paired-reveal-beeld — valt terug op `--color-text` |
| `--space-sm`, `--space-md`, `--space-lg`, `--space-xl` | gaps en padding |
| `--font-mono`, `--step--1` | meta-regel in quadrant, bijschriften in triptych en detail, labels in duet |
| `--breathe-from`, `--breathe-to` *(optioneel)* | begin- en eindkleur van de grond onder `layout: breathe`; optioneel `--breathe-via-1` / `--breathe-via-2` voor de tussenstanden en `--breathe-duration` (standaard 75s). Zonder deze tokens staat de grond stil op `--color-bg` — geen effect in plaats van een verkeerd effect |

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

## Bouwen

`npm run build` bouwt eerst de Astro-site, dan alle decks. Slidev-output
gaat naar `dist/slides/<theme-id>/` met `--base /cursus-esthetica/slides/<id>/`
zodat hashed assets correct laden onder de GitHub Pages subpath.

Alleen decks bouwen:

```bash
npm run build:slides
```

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
   `detail.vue`, `breathe.vue` en `paired-reveal.vue` gebruiken een lokale
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
