---
name: add-interactive-component
description: Use this skill whenever an interactive component (quiz, timed viewer, comparator, annotator, or any other stateful widget) needs to be added to a course chapter in this Cursus Esthetica project. Triggers on phrases like "voeg een interactieve oefening toe", "integreer dit artifact", "bouw een widget voor hoofdstuk X", "maak hier een interactief element van voor de site", or when the user pastes a React/JSX prototype and asks for it to be integrated into a chapter. Also triggers when building a new interactive component from scratch for a chapter. Covers the two primary workflows (integrating a prototype and building from scratch), file structure, React-island setup, styling conventions, and MDX integration.
---

# Interactive component integration

This project uses a consistent pattern for interactive components in course chapters. Every interactive widget — quizzes, timed viewers, comparators, annotators — follows the same file structure, styling conventions, and MDX integration. This ensures the codebase stays navigable as more chapters are added.

## Two workflows

Most interactive components enter the project in one of two ways. Identify which workflow applies before starting.

### Workflow A: integrating a pasted prototype (most common)

The user pastes a React/JSX prototype (typically a Claude Artifact) and asks for it to be integrated into a specific chapter. The prototype is usually a single `.jsx` file with inline styles and hardcoded hex colors. In this case:

1. Ask the user which chapter the component belongs to, if not specified
2. Decide component name (PascalCase, descriptive — `DefinitionTest`, `TimedViewer`, `ColorWheel`)
3. Decide placement (chapter-specific vs reusable — see "Placement decision" below)
4. Verify React integration is installed (see "Astro configuration" below)
5. Create the three component files (`.astro`, `.tsx`, `.module.css`)
6. Port the prototype code mechanically into `.tsx`:
   - Remove any `C` / `COLORS` / `FONT_*` constant objects — these are replaced by CSS variables
   - Move all static styles into `.module.css`, using `var(--color-*)`, `var(--font-*)`, `var(--space-*)` tokens
   - Keep inline styles only for dynamic/computed values (e.g., `style={{ width: \`${score * 100}%\` }}`)
   - Convert `.jsx` to `.tsx` with proper TypeScript types for state, props, and data structures
   - Preserve all behaviour exactly — do not redesign or "improve" during port
7. Add the MDX import and component tag at the correct location in the chapter file
8. Report back with a summary of what was done and any manual steps still required

### Workflow B: building from scratch

The user describes what the component should do without providing a prototype. In this case, draft the component directly using the file structure and conventions below. Still follow steps 1-5 and 7-8 above; step 6 becomes "write the component" instead of "port it."

## Placement decision

**Chapter-specific (`src/components/themes/<chapter-id>/`):** the component's *content* is tied to one chapter. The definition-test in "wat-is-kunst" contains six specific scenarios and four specific philosophers — moving it to another chapter would require rewriting it. Most interactive components will be chapter-specific.

**Reusable (`src/components/interactive/`):** the component is a *pattern* that takes content as props. A three-minute timed viewer works for any artwork. A before/after comparator works for any pair of images. Only build as reusable when there is a concrete second use case in mind — speculative abstraction is costly here.

When in doubt, start chapter-specific. Promoting a component to `interactive/` later is cheap; demoting a prematurely-generic one is painful.

## File structure

### Chapter-specific component

```
src/components/themes/<chapter-id>/
  <ComponentName>.astro          # Thin Astro wrapper
  <ComponentName>.tsx            # React component with logic
  <ComponentName>.module.css     # Scoped styles
```

### Reusable component

```
src/components/interactive/
  <ComponentName>.astro
  <ComponentName>.tsx
  <ComponentName>.module.css
```

## The Astro wrapper (`<ComponentName>.astro`)

Keep it minimal. The wrapper exists to load the React island with the correct hydration directive.

```astro
---
import ReactComponent from './<ComponentName>.tsx';

interface Props {
  // Only if the component takes props (typical for reusable ones)
}

const props = Astro.props;
---

<ReactComponent {...props} client:visible />
```

Use `client:visible` by default — the component only hydrates when it scrolls into view. Use `client:load` only when the component must be interactive immediately on page load (rare).

## The React component (`<ComponentName>.tsx`)

### Styling: CSS Modules with design tokens

Do NOT use inline styles with hardcoded hex values or font strings. All visual values come from CSS custom properties defined in `src/styles/tokens.css`.

Use CSS Modules as the default:

```tsx
import styles from './DefinitionTest.module.css';

<div className={styles.card}>...</div>
<button className={`${styles.choice} ${selected ? styles.choiceSelected : ''}`}>
  ...
</button>
```

```css
/* DefinitionTest.module.css */
.card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  padding: var(--space-md);
  font-family: var(--font-sans);
}
```

Inline styles are acceptable only for computed values:

```tsx
<div style={{ width: `${score * 100}%` }} />
```

Never write `color: '#ED4B9E'` or `fontFamily: "'Inter', sans-serif"` in component code. These values belong in tokens.

### Token reference

| Value in prototype | Replace with |
|---|---|
| `#1a1a1a` | `var(--color-bg)` |
| `#232323` | `var(--color-bg-elevated)` |
| `#2a2a2a` | `var(--color-surface)` |
| `#444444` | `var(--color-border)` |
| `#333333` | `var(--color-border-subtle)` |
| `#f5f3ee` | `var(--color-text)` |
| `#c8c5bc` | `var(--color-text-muted)` |
| `#a8a59c` | `var(--color-text-dim)` |
| `#888888` | `var(--color-text-quiet)` |
| `#666666` | `var(--color-text-whisper)` |
| `#ED4B9E` | `var(--color-accent)` |
| `rgba(237, 75, 158, 0.08)` | `var(--color-accent-soft)` |
| `'Fraunces', ...` | `var(--font-serif)` |
| `'Inter', ...` | `var(--font-sans)` |
| `'JetBrains Mono', ...` | `var(--font-mono)` |

For spacing, match prototype values to the nearest `--space-*` step: `0.5rem` → `--space-xs`, `1rem` → `--space-sm`, `1.5rem` → `--space-md`, `2.5rem` → `--space-lg`, `4rem` → `--space-xl`, `6rem` → `--space-2xl`.

For type scale: `0.833rem` → `--step--1`, `1rem` → `--step-0`, `1.2rem` → `--step-1`, `1.44rem` → `--step-2`, `1.728rem` → `--step-3`, `2.488rem` → `--step-4`, `3.583rem` → `--step-5`.

### State

Use `useState` and `useMemo` for local state. Do NOT use `localStorage` or `sessionStorage` — the current design treats each session as fresh. If persistence is later required, it becomes a deliberate project-wide decision.

### TypeScript

Convert `.jsx` to `.tsx` with proper types. Common patterns:

```tsx
type Answer = 'kunst' | 'geen-kunst' | 'twijfel';

const [answers, setAnswers] = useState<Record<string, Answer>>({});

interface Profile {
  name: string;
  expects: Record<string, number>;
}
```

Do not use `any`. If the prototype had loose typing, tighten it during the port.

### No external dependencies by default

Stick to React's built-in hooks. Do not add icon libraries, animation libraries, or UI frameworks. If animation is needed, use CSS transitions. If icons are needed, use inline SVG.

## MDX integration

Each chapter's `.mdx` file imports and uses the component directly. Goal: the MDX stays readable.

```mdx
---
id: wat-is-kunst
title: Wat is kunst?
module: waarnemen
order: 0
figure: "00"
shortDescription: ...
---

import DefinitionTest from '../../components/themes/wat-is-kunst/DefinitionTest.astro';

## Geen definitie, wel een spel

[prose]

<DefinitionTest />

[prose continues]
```

Rules:
- Always import the `.astro` wrapper, not the `.tsx` directly
- One import per component at the top of the MDX (after frontmatter)
- Self-closing tag unless the component explicitly takes children
- Do NOT pass inline content as props. If the component needs chapter-specific content (scenarios, prompts, data), that content lives *inside* the component's own file
- MDX does NOT support HTML-style `<!-- ... -->` comments. Use JSX-style `{/* ... */}` instead

Exception: reusable components (`interactive/`) take content via props, because that's their whole point.

## Astro configuration check

For React islands to work, `@astrojs/react` must be installed and wired in `astro.config.mjs`.

Before integrating the first interactive component in this project, check:

```bash
grep -l "@astrojs/react" astro.config.mjs package.json
```

If not present, run:

```bash
npx astro add react
```

This adds the integration and installs `react`, `react-dom`, `@types/react`, `@types/react-dom`. Confirm the result by checking `astro.config.mjs` shows `react()` in the integrations array.

On subsequent components, this check can be skipped — React will already be configured.

## Standard workflow output

When completing an integration, report back with:

1. Which files were created (with paths)
2. Where the component was inserted in the MDX (section name or line reference)
3. Any remaining manual steps (e.g., "run `npm run dev` to verify", "you mentioned an image placeholder — add the actual image at `/public/images/...`")
4. Anything from the prototype that required a judgement call during the port (e.g., "the prototype used `0.95rem` which I mapped to `--step-0`; adjust if you want it smaller")

## Checklist before finishing

- [ ] Component is in the correct folder (chapter-specific vs reusable)
- [ ] `.astro` wrapper exists and uses `client:visible`
- [ ] No hardcoded hex colors or font strings in the `.tsx`
- [ ] All static styling is in `.module.css`, using CSS variables
- [ ] MDX imports the `.astro` wrapper, not the `.tsx`
- [ ] MDX comments use `{/* ... */}` syntax, not `<!-- ... -->`
- [ ] Component renders correctly on mobile (test narrow viewport if possible)
- [ ] No external dependencies added unless strictly necessary
- [ ] Behaviour matches the prototype exactly (no unrequested redesign)

## Example: the definition-test

The first component built with this pattern is the definition-test in "Wat is kunst?". It lives at:

```
src/components/themes/wat-is-kunst/
  DefinitionTest.astro
  DefinitionTest.tsx
  DefinitionTest.module.css
```

Use it as the canonical reference when in doubt about naming, structure, or styling approach.