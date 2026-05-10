# Slides

Per-thema klassikale presentaties, gebouwd met [Slidev](https://sli.dev).
Elke deck wordt gepubliceerd onder `/cursus-esthetica/slides/<theme-id>/`
op dezelfde GitHub Pages-site als de cursus.

## Structuur

```
slides/
  theme/                    # gedeelde lokale Slidev-theme (mapt op tokens.css)
  <theme-id>/slides.md      # één map per deck
  build-all.mjs             # bouwt alle decks naar dist/slides/<id>/
```

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

1. Maak `slides/<theme-id>/slides.md` aan met headmatter `theme: ../theme`.
2. `npx slidev slides/<theme-id>/slides.md` om interactief te schrijven.
3. Commit. De `slides →`-knop op de bijbehorende ThemeCard verschijnt
   automatisch bij de volgende build.
