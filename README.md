# Cursus Esthetica

Een Astro-site voor een cursus esthetica. Inhoud bestaat uit ~14 thema's
verdeeld over drie tot vier modules, met interactieve componenten ingebed
in MDX-hoofdstukken. Elk thema krijgt daarnaast een eigen Slidev-presentatie
voor klassikaal gebruik.

Live: https://yvanvds.github.io/cursus-esthetica

## Stack

- **Astro 6** met MDX en React-eilanden voor interactieve componenten
- **Slidev** voor per-thema presentaties
- **Pure CSS** met design tokens — geen framework
- **TypeScript strict mode**
- Deploy via GitHub Actions naar GitHub Pages

## Structuur

```text
/
├── src/
│   ├── content/
│   │   ├── modules/        # markdown — module-metadata
│   │   └── themes/         # mdx — één bestand per thema-hoofdstuk
│   ├── components/         # Astro/React componenten (per-thema submappen)
│   ├── layouts/            # base + per-thema custom layouts
│   ├── lib/                # helpers (reading-time, has-slides, …)
│   ├── pages/              # routes
│   ├── styles/
│   │   ├── tokens.css      # design tokens — single source of truth
│   │   └── themes/         # per-thema custom stylesheets
│   └── content.config.ts   # collection schema's
├── public/
│   ├── fonts/
│   └── images/             # per-thema submappen
├── slides/
│   ├── theme/              # gedeelde lokale Slidev-theme
│   ├── <theme-id>/slides.md
│   └── build-all.mjs       # bouwt alle decks naar dist/slides/<id>/
├── docs/
│   └── BRIEFING.md         # complete technische en design-spec
├── astro.config.mjs
└── package.json
```

### Inhoud

- **Modules** (`src/content/modules/*.md`) groeperen thema's. Schema in
  `src/content.config.ts`.
- **Thema's** (`src/content/themes/*.mdx`) zijn de hoofdstukken. Frontmatter
  bepaalt accent, custom layout, custom styles, figures en videos.
- **URL-slug** = bestandsnaam (`licht-en-schaduw.mdx` →
  `/licht-en-schaduw/`). Slidev-decks volgen dezelfde slug.

### Per-thema customisatie

Drie escalerende niveaus (zie `docs/BRIEFING.md` §5):

1. `accentColor` in frontmatter — overschrijft `--color-accent`.
2. `customStyles: "<file>.css"` — laadt `src/styles/themes/<file>.css`.
3. `customLayout: "<Name>"` — vervangt de standaardlayout volledig.

### Conventies

- **Inhoud is Nederlands.** URL's, button-labels en gebruikersgerichte
  teksten ook. Codenamen, variabelen en commentaar zijn Engels.
- **Geen hardcoded waarden** in componenten. Altijd `var(--color-*)`,
  `var(--font-*)`, `var(--space-*)` uit `tokens.css`.
- **TypeScript strict** in alle `.astro`/`.ts`-bestanden.

## Astro-commando's

Vanaf de root van het project, in een terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build site **én** alle Slidev-decks naar `./dist/` |
| `npm run build:site`      | Bouw alleen de Astro-site                        |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Slidev-commando's

Elk thema heeft een optionele klassikale presentatie onder
`slides/<theme-id>/slides.md`. De `slides →`-knop op een ThemeCard
verschijnt automatisch zodra het bestand bestaat.

| Command                                          | Action                                            |
| :----------------------------------------------- | :------------------------------------------------ |
| `npx slidev slides/<theme-id>/slides.md`         | Dev-server voor één deck (http://localhost:3030)  |
| `npm run build:slides`                           | Bouw alle decks naar `dist/slides/<theme-id>/`    |
| `npx slidev export slides/<theme-id>/slides.md`  | Export naar PDF (vereist `playwright-chromium`)   |

Een nieuw deck toevoegen:

1. Maak `slides/<theme-id>/slides.md` aan met headmatter `theme: ../theme`.
2. Schrijf interactief: `npx slidev slides/<theme-id>/slides.md`.
3. Commit. De `slides →`-knop verschijnt bij de volgende build.

Zie [`slides/README.md`](slides/README.md) voor verdere details.

## Deployment

`.github/workflows/build.yml` triggered op push naar `main`. Voert
`npm run build` uit (Astro dan Slidev), upload `dist/` naar GitHub Pages.

`base` is geconfigureerd op `/cursus-esthetica` in `astro.config.mjs`.
Slidev-decks krijgen `--base /cursus-esthetica/slides/<id>/` mee in
`slides/build-all.mjs`.

## Verder lezen

- [`docs/BRIEFING.md`](docs/BRIEFING.md) — complete technische en design-spec
- [`CLAUDE.md`](CLAUDE.md) — context voor Claude Code-sessies
- [`slides/README.md`](slides/README.md) — werken aan presentaties
