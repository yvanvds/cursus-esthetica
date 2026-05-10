# Cursus Esthetica — Claude Code context

This is an Astro site hosting a course on aesthetics. The course consists of
~14 themes grouped into 3-4 modules, with interactive components embedded
in MDX chapters.

## Before doing anything, read

- `docs/BRIEFING.md` — complete technical and design specification. Covers
  tech stack, design tokens, project structure, content collections,
  per-theme customisation mechanisms, and deployment.

## Skills available

This project has project-specific skills in `.claude/skills/`. They trigger
automatically based on the task description. Key skills:

- **`add-interactive-component`** — use whenever an interactive widget
  (quiz, viewer, comparator, etc.) is added to a chapter. Defines the file
  structure, React-island setup, styling conventions, and MDX integration
  that all interactive components must follow. Triggered by any task that
  involves building or integrating an interactive educational component.
- **`draft-theme-chapter`** — use when converting old course material
  (OneNote dump, PDF export, PowerPoint) into a new MDX chapter. Defines
  a three-phase workflow (skelet → beeld/video-onderzoek → MDX-uitwerking),
  the voice signatures to imitate, image-download conventions, and a
  movement-level verification checklist. Primarily a Cowork-mode skill
  (image research and download benefit from web access).

## Key conventions (summary)

- **Language:** Dutch for content, URLs, and user-facing strings; English
  for code identifiers, variable names, and comments.
- **No CSS framework.** Pure CSS with custom properties defined in
  `src/styles/tokens.css`. Never hardcode hex values or font strings in
  components — always use `var(--color-*)`, `var(--font-*)`, `var(--space-*)`.
- **Content lives in** `src/content/modules/` (markdown) and
  `src/content/themes/` (MDX). Schema in `src/content.config.ts`.
- **Per-theme customisation** follows three escalating levels: accent
  override, custom stylesheet, custom layout. See BRIEFING.md §5.
- **TypeScript strict mode** across all `.astro` and `.ts` files.

## What to consult when uncertain

| Task | Read |
|---|---|
| Overall architecture | `docs/BRIEFING.md` |
| Adding an interactive component | `.claude/skills/add-interactive-component/SKILL.md` |
| Design tokens | `src/styles/tokens.css` |
| Content schema | `src/content.config.ts` |
| Existing pattern for a theme | `src/content/themes/wat-is-kunst.mdx` + its components |

## Scope

Default working scope is `src/`, `docs/`, `public/`, and root-level config
files (`astro.config.mjs`, `package.json`, `tsconfig.json`, `CLAUDE.md`,
`README.md`). Do not read or scan `node_modules/`, `dist/`, `.astro/`, or
`.git/` unless I explicitly ask. For typical content work, the relevant
directory is `src/content/themes/` (MDX chapters) and the components they
import from `src/components/`.

## Style of work

The project owner is a software developer. Be technically precise, explicit
about trade-offs, and willing to push back when an approach has flaws.
Don't pad explanations with basics. When a skill applies, follow it — the
skills encode conventions established in earlier sessions.