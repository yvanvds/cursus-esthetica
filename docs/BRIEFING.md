# Briefing: Cursus Esthetica — website

Dit document beschrijft de architectuur, het ontwerpsysteem en de conventies
voor een Astro-website die een cursus esthetica host. De cursus bestaat uit
~14 thema's, gegroepeerd in 3-4 modules. De site moet statisch gerenderd
worden (GitHub Pages) en later per thema een eigen visuele identiteit kunnen
krijgen.

De opdrachtgever is zelf softwareontwikkelaar. Code mag dus technisch
precies zijn. Prioriteer leesbaarheid en expliciete structuur boven
clevere abstracties.

---

## 1. Tech stack

- **Astro** (minimal template, reeds geïnitialiseerd)
- **MDX** voor cursusinhoud met ingebedde interactieve componenten
- **TypeScript** voor alle `.astro`-componenten en content schemas
- **Geen CSS-framework.** Puur CSS met custom properties. Tailwind werkt
  tegen de editorial/atelier-esthetiek en bemoeilijkt per-thema overrides.
- **Lokale fonts** (zelf-gehost, geen Google Fonts CDN) voor privacy en
  laadsnelheid
- **Slidev** voor presentaties — apart ingericht, later toegevoegd

## 2. Ontwerpsysteem

### Basiskleuren

```css
:root {
  /* Basis */
  --color-bg:           #1a1a1a;   /* donkergrijs, default achtergrond */
  --color-bg-elevated:  #232323;   /* kaarten, modules */
  --color-surface:      #2a2a2a;   /* afbeelding-placeholders */
  --color-border:       #444444;
  --color-border-subtle:#333333;

  /* Tekst */
  --color-text:         #f5f3ee;   /* gebroken wit */
  --color-text-muted:   #c8c5bc;
  --color-text-dim:     #a8a59c;
  --color-text-quiet:   #888888;
  --color-text-whisper: #666666;

  /* Accent */
  --color-accent:       #ED4B9E;   /* fuchsia - huisstijl */
  --color-accent-soft:  rgba(237, 75, 158, 0.08);
}
```

Elk thema kan later deze variabelen lokaal overschrijven (zie §5).

### Typografie

Drie families, alle lokaal gehost:

- **Fraunces** (variabele serif) — display, headers, typografische accenten.
  Gebruik voor: h1, h2 van modules, kaart-titels. Vaak in `font-weight: 400`
  en soms `font-style: italic` voor karakter.
- **Inter** (variabele sans) — body, knoppen, UI-tekst.
  Gebruik voor: paragrafen, beschrijvingen, knoppen.
- **JetBrains Mono** (mono) — metadata, labels, nummers, "technische"
  details. Gebruik voor: themanummers, fig-labels, navigatie-items,
  kleine annotaties. Kleine letter, vaak `letter-spacing: 0.1em` en
  `text-transform: uppercase` voor het atelier-gevoel.

```css
:root {
  --font-serif: 'Fraunces', Georgia, serif;
  --font-sans:  'Inter', -apple-system, system-ui, sans-serif;
  --font-mono:  'JetBrains Mono', 'SF Mono', Menlo, monospace;
}
```

Download de webfonts en plaats ze in `/public/fonts/`. Laad met
`@font-face` in `/src/styles/fonts.css` met `font-display: swap`.

### Type-schaal

Modulair, met relatieve waarden zodat per thema eenvoudig te schalen:

```css
:root {
  --step--1: 0.833rem;   /* metadata, captions */
  --step-0:  1rem;        /* body */
  --step-1:  1.2rem;      /* lead paragraph */
  --step-2:  1.44rem;     /* h3 */
  --step-3:  1.728rem;    /* h2 */
  --step-4:  2.488rem;    /* h1 kaart */
  --step-5:  3.583rem;    /* hero */
}
```

### Ruimte-schaal

```css
:root {
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2.5rem;
  --space-xl: 4rem;
  --space-2xl: 6rem;
}
```

### Overige conventies

- Border radius: `4px` standaard (subtiel), `0` voor editorial items
- Geen schaduwen, geen gradiënten (behalve subtiele placeholder-achtergronden)
- Hover states: opacity of border-kleur, nooit transforms
- Transities: `150ms ease` voor kleur, `300ms ease` voor opacity

## 3. Projectstructuur

```
/
├── public/
│   ├── fonts/              # Lokaal gehoste webfonts
│   ├── images/
│   │   └── themes/         # Foto's per thema
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── base/           # Herbruikbare basiscomponenten
│   │   │   ├── ThemeCard.astro
│   │   │   ├── ModuleHeader.astro
│   │   │   ├── ScrollRow.astro
│   │   │   ├── SiteHeader.astro
│   │   │   └── SiteFooter.astro
│   │   └── themes/         # Per-thema custom componenten (later)
│   ├── content/
│   │   ├── config.ts       # Content collections schema
│   │   ├── modules/        # Module-metadata (markdown + frontmatter)
│   │   └── themes/         # Cursusinhoud per thema (MDX)
│   ├── layouts/
│   │   ├── BaseLayout.astro        # Default voor alle pagina's
│   │   ├── ThemeLayout.astro       # Default thema-pagina layout
│   │   └── themes/                 # Per-thema custom layouts (later)
│   ├── pages/
│   │   ├── index.astro             # Homepage
│   │   ├── [theme].astro           # Dynamische thema-routes
│   │   └── over.astro
│   └── styles/
│       ├── fonts.css               # @font-face declaraties
│       ├── tokens.css              # CSS custom properties (§2)
│       ├── base.css                # Reset + base typography
│       └── global.css              # Imports bovenstaande
└── astro.config.mjs
```

## 4. Content collections

Gebruik Astro's content collections met TypeScript schemas.

### `src/content/config.ts`

```typescript
import { defineCollection, z } from 'astro:content';

const modules = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),          // 'kunst-wetenschap'
    title: z.string(),        // 'Kunst en wetenschap'
    order: z.number(),        // Voor volgorde op homepage
    intro: z.string(),        // Korte beschrijving
  }),
});

const themes = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),           // 'perspectief-en-ruimte'
    title: z.string(),
    module: z.string(),       // FK naar module.id
    order: z.number(),        // Volgorde binnen module
    shortDescription: z.string(),
    figure: z.string(),       // '01', '02', etc.
    image: z.string().optional(),

    // Optioneel: custom theming (later gebruikt per thema)
    customLayout: z.string().optional(),  // Naam van custom layout
    customStyles: z.string().optional(),  // Pad naar custom CSS
    accentColor: z.string().optional(),   // Override accent
  }),
});

export const collections = { modules, themes };
```

### Voorbeeld thema-bestand

`src/content/themes/perspectief-en-ruimte.mdx`:

```mdx
---
id: perspectief-en-ruimte
title: Perspectief en ruimte
module: kunst-wetenschap
order: 1
figure: "01"
shortDescription: Drie dimensies op een plat vlak — een esthetische en filosofische revolutie.
image: /images/themes/perspectief.jpg
---

# Perspectief en ruimte

Inhoud in MDX. Interactieve componenten kunnen hier direct ingebed worden:

import PerspectiveDemo from '../../components/themes/PerspectiveDemo.astro';

<PerspectiveDemo />

Gewone markdown blijft werken.
```

## 5. Thema-flexibiliteit: hoe "uitbreken" werkt

Dit is een kernconcept. Elk thema begint met de basis-identiteit, maar kan
op drie niveaus afwijken:

### Niveau 1: Alleen accentkleur wijzigen

In frontmatter: `accentColor: "#00D4C8"`. De `ThemeLayout` leest dit en
overschrijft `--color-accent` voor die pagina alleen.

### Niveau 2: Custom stylesheet

In frontmatter: `customStyles: "graffiti.css"`. De layout laadt dan
`/src/styles/themes/graffiti.css` *na* de basis-CSS. Dit bestand kan
variabelen overschrijven, nieuwe regels toevoegen, of volledig andere
typografie definiëren.

### Niveau 3: Volledig eigen layout

In frontmatter: `customLayout: "Graffiti"`. In plaats van `ThemeLayout`
gebruikt de pagina dan `/src/layouts/themes/Graffiti.astro`. Dit geeft
volledige controle over de HTML-structuur, niet alleen styling.

### Implementatie in `[theme].astro`

```astro
---
import { getCollection, getEntry } from 'astro:content';
import ThemeLayout from '../layouts/ThemeLayout.astro';

export async function getStaticPaths() {
  const themes = await getCollection('themes');
  return themes.map(theme => ({
    params: { theme: theme.data.id },
    props: { theme }
  }));
}

const { theme } = Astro.props;
const { Content } = await theme.render();

// Dynamisch layout kiezen
let Layout = ThemeLayout;
if (theme.data.customLayout) {
  Layout = (await import(`../layouts/themes/${theme.data.customLayout}.astro`)).default;
}
---

<Layout theme={theme}>
  <Content />
</Layout>
```

Belangrijk: de `BaseLayout` (navigatie, footer, font-loading) blijft altijd
geldig, ongeacht hoe een thema verder afwijkt. Custom layouts erven van
`BaseLayout`.

## 6. Homepage (`src/pages/index.astro`)

### Structuur

```
<BaseLayout>
  <SiteHeader>
  <Hero>
  <ModuleSection> × N (één per module, volgens order)
    <ModuleHeader>
    <ScrollRow>
      <ThemeCard> × N (één per thema in deze module, volgens order)
  <SiteFooter>
</BaseLayout>
```

### Hero

```html
<section class="hero">
  <p class="hero__label">— veertien manieren van kijken</p>
  <h1 class="hero__title">
    Wat maakt iets <em>mooi</em>, vreemd, of waard om naar te kijken?
  </h1>
  <p class="hero__lead">
    Een cursus esthetica die niet in chronologische volgorde werkt, maar in
    dwarsdoorsneden. Vier modules, veertien hoofdstukken.
  </p>
</section>
```

Het `<em>`-element krijgt `color: var(--color-accent)` en
`font-style: italic`. Het `.hero__label` gebruikt mono-font met uppercase
letter-spacing.

### ModuleHeader

Nummer (mono fuchsia) + titel (serif italic) + intro (sans). Rechts een
discrete teller ("4 hoofdstukken"). Op mobiel stacken verticaal.

### ScrollRow

Horizontaal scrollbare container met `scroll-snap-type: x mandatory`. Op
desktop zijn ~3 kaarten zichtbaar (kaart breedte 240px + 16px gap). Op
mobiel is 1 kaart breed met de volgende half zichtbaar.

```css
.scroll-row {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: var(--space-sm);
  scrollbar-width: thin;
}

.scroll-row > * {
  flex: 0 0 240px;
  scroll-snap-align: start;
}

@media (max-width: 640px) {
  .scroll-row > * {
    flex: 0 0 75%;
  }
}
```

### ThemeCard

- 4:3 afbeeldingsplaceholder (of echte foto als aanwezig)
- Mono-label met nummer en trefwoord in accent-kleur
- Serif kaarttitel
- Sans korte beschrijving
- Twee knoppen: cursus (prominent) en slides (subtiel). Beide mono-font.

Knoppen zijn bewust tekst-links met border, niet gevulde buttons. Dit past
bij de editorial/atelier-stijl.

## 7. Responsief gedrag

Breakpoints:

```css
/* Mobiel first, opbouwend */
@media (min-width: 640px)  { /* tablet */ }
@media (min-width: 1024px) { /* desktop */ }
@media (min-width: 1440px) { /* ruim desktop */ }
```

### Kritieke aanpassingen

**Mobiel (<640px):**
- Hero titel: `--step-3` in plaats van `--step-5`
- Module header: stack verticaal, teller onder intro
- ScrollRow kaarten: 75% breedte (volgende half zichtbaar)
- Padding pagina: `var(--space-sm)` in plaats van `var(--space-lg)`

**Tablet (640-1024px):**
- Hero titel: `--step-4`
- ScrollRow kaarten: 280px vast
- Pagina-container: max 720px

**Desktop (>1024px):**
- Hero titel: `--step-5`
- ScrollRow kaarten: 240px vast, 3+ zichtbaar
- Pagina-container: max 1080px met generous gutters

## 8. Fontloading

Download variabele versies:
- Fraunces: https://fonts.google.com/specimen/Fraunces (variable)
- Inter: https://fonts.google.com/specimen/Inter (variable)
- JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono

Plaats `.woff2`-bestanden in `/public/fonts/`.

```css
/* src/styles/fonts.css */
@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/Fraunces-VariableFont.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
/* idem voor Inter en JetBrains Mono */
```

Preload de belangrijkste fonts in `BaseLayout.astro`:

```html
<link rel="preload" href="/fonts/Fraunces-VariableFont.woff2"
      as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/Inter-VariableFont.woff2"
      as="font" type="font/woff2" crossorigin />
```

## 9. GitHub Pages deployment

In `astro.config.mjs`:

```javascript
export default defineConfig({
  site: 'https://<username>.github.io',
  base: '/<repo-name>',
  // of voor custom domain: site: 'https://esthetica.example.com', geen base
});
```

GitHub Actions workflow `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 10. Slidev-integratie (later)

Voor presentaties wordt Slidev als aparte subsite gebouwd:

```
/slides/
  /perspectief-en-ruimte/
    slides.md
    package.json
  ...
```

Elke Slidev-site exporteert naar statische HTML en wordt gedeployed naar
`/slides/<theme-id>/` binnen dezelfde GitHub Pages-site. In de `ThemeCard`
wijst de "slides →"-link naar `/slides/<theme-id>/`.

Dit wordt pas geïmplementeerd nadat de basis-site werkt. Zorg er bij de
initiële opzet wel voor dat de `/slides/` link placeholders correct zijn.

## 11. Initiële taken

Bouw in deze volgorde:

1. **Design tokens** — `src/styles/tokens.css`, `fonts.css`, `base.css`
2. **Fontbestanden** — download en plaats in `/public/fonts/`
3. **Content schema** — `src/content/config.ts`
4. **Base componenten** — `BaseLayout`, `SiteHeader`, `SiteFooter`
5. **Placeholder content** — 4 modules, 14 thema's met beschrijvingen
   (gebruik de thema-lijst van de opdrachtgever, plaatsing in modules mag
   je voorstellen maar laat het aanpasbaar)
6. **Homepage** — Hero, ModuleHeader, ScrollRow, ThemeCard
7. **ThemeLayout** — default voor thema-pagina's met MDX-content
8. **Dynamische routes** — `[theme].astro` met custom-layout ondersteuning
9. **GitHub Actions** — deployment workflow
10. **Responsief gedrag** — test en verfijn breakpoints

## 12. Codeerconventies

- Alle `.astro` en `.ts` bestanden gebruiken TypeScript met strict mode
- Geen inline styles behalve voor dynamische waarden (bv. `style={`--accent: ${accentColor}`}`)
- CSS componenten: gebruik `<style>` blokken in `.astro` (scoped) tenzij
  de styling expliciet globaal is
- Namen in Nederlands voor content en URLs, Engels voor code
- Kleine componenten (< 100 regels) prefereren boven grote monolieten
- Geen magic numbers in CSS — altijd via custom properties

## 13. Referentiemateriaal in de repo

Plaats de volgende bestanden in `/docs/` voor toekomstige sessies:

- `BRIEFING.md` — dit document
- `THEMES.md` — de volledige thema-lijst met beschrijvingen
- `CLAUDE.md` — instructies voor Claude Code (verwijst naar bovenstaande)

`CLAUDE.md` in de root zegt minimaal:

> Dit is de esthetica-cursus website. Lees `/docs/BRIEFING.md` voor de
> architectuur en het ontwerpsysteem. Content komt uit `/src/content/`.
> Per-thema visuele identiteiten kunnen worden toegevoegd volgens het
> mechanisme beschreven in sectie 5 van de briefing.

---

## Uitgangspunten voor dit ontwerp

De opdrachtgever heeft expliciet gekozen voor:

- **Atelier-esthetiek** — ruw, experimenteel, onaf mag
- **Hedendaags/digitaal** als dominante tijdsesthetiek
- **Anti "digitaal academisch"** — pure esthetische expressie prioriteren
- **Donkergrijs + fuchsia** als huisstijl, met ruimte voor extra kleuren
- **Rijke typografie** — serif + sans + mono samen
- **14 thema's in 3-4 modules** (definitieve indeling later)
- **Later per-thema eigen identiteit** — architectuur moet dit
  mogelijk maken zonder refactor