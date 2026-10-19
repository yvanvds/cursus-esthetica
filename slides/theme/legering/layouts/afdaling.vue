<!--
  De titelslide als afdaling: per klik zakt het beeld één verdieping, van
  Piltover naar Zaun, en de titel slaat om van deco naar nouveau.

  Bestaat omdat de opening van het hoofdstuk een beweging is en geen beeld:
  Vi en Powder klimmen over de daken van Piltover en dalen af, lift na lift,
  naar de stad onder de stad. Het deck doet die beweging vóór het één woord
  uitlegt, en de titel verandert onderweg van letter: bovenaan Poiret One
  in goud (Piltover, deco), onderaan Cormorant cursief in groen (Zaun,
  nouveau). Daarmee staat de omslag van het hele hoofdstuk al op de eerste
  slide. Geen gedeelde layout kan dat: `breathe` wisselt beelden op één
  plek, `paired-reveal` zet ze naast tekst; hier moet de camera zakken.

  Thema-eigen (legering).

  Gebruik:
    ---
    layout: afdaling
    images:
      - { src: /cursus-esthetica/images/art-nouveau-en-deco/arcane-piltover-uitzicht.jpg, label: Piltover }
      - { src: /cursus-esthetica/images/art-nouveau-en-deco/arcane-piltover-dak.jpg, focus: 60% 50% }
      - { src: /cursus-esthetica/images/art-nouveau-en-deco/arcane-zaun-stad.jpg, label: Zaun, focus: 50% 0%, zoom: 1.14 }
    ---

    # Voor wie is de toekomst gebouwd?

    Cursus Esthetica · hoofdstuk 15

  Per beeld: `src`, optioneel `label` (naam op de dieptemeter rechts),
  `focus` (object-position, waar het beeld bijgesneden wordt) en `zoom`
  (vergroot vanuit `focus`; om een watermerkstrook onderaan buiten beeld te
  duwen). Stap 0 is het bovenste beeld; elke klik zakt één beeld. De titel
  staat er twee keer — in een deco-cartouche bovenaan, zichtbaar op stap 0,
  en in een nouveau-cartouche onderaan, zichtbaar op de laatste stap.
  Tussenin daalt het beeld zonder titel.

  De beelden zijn een strook die als één geheel verschuift; elk beeld loopt
  een stukje over zijn buren en vervaagt daar, zodat de daling geen harde
  naad heeft. `object-fit: cover`: dit is een filmbeeld dat de slide vult,
  geen werk dat volledig in beeld moet — de beelden staan in beweging 1 nog
  eens volledig.

  De layout registreert zijn klikken zelf (beelden − 1, via `useOwnClicks`):
  zonder `v-click` in de template telt Slidev anders nul klikken en verlaat
  de pijltjestoets de slide zonder af te dalen (#93). Beeldpaden door
  `resolveAsset`.
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset, useOwnClicks } from '../../layouts-base/utils'

interface Level {
  src: string
  label?: string
  focus?: string
  zoom?: number
}

const props = withDefaults(
  defineProps<{
    images?: Array<string | Level>
  }>(),
  { images: () => [] },
)

const levels = computed(() =>
  props.images.map((entry): Required<Level> => {
    const level = typeof entry === 'string' ? { src: entry } : entry
    return {
      src: resolveAsset(level.src),
      label: level.label ?? '',
      focus: level.focus ?? '50% 50%',
      zoom: level.zoom ?? 1,
    }
  }),
)

const last = computed(() => Math.max(levels.value.length - 1, 0))

/* Zonder v-click in de template telt Slidev geen klikken; zie useOwnClicks. */
useOwnClicks(() => last.value)

const { $clicks } = useSlideContext()
const step = computed(() => Math.min(Math.max($clicks.value, 0), last.value))

/** Hoeveel een beeld over zijn buren loopt, in procent van de slidehoogte. */
const OVERLAP = 9

/**
 * Elk beeld behalve het eerste begint OVERLAP boven zijn eigen verdieping en
 * vloeit over die OVERLAP in over het beeld erboven, dat daar gewoon
 * doorloopt. Alleen het bovenste van de twee vervaagt, dus de dekking blijft
 * overal volledig en de naad wordt nergens donker; en in rust staat elk
 * beeld zuiver in beeld — alleen onderaan schemert de volgende verdieping
 * al door.
 */
function panelStyle(i: number): CSSProperties {
  const n = levels.value.length
  const above = i === 0 ? 0 : OVERLAP
  const height = 100 + above
  const fade = (above / height) * 100
  const mask = i === 0 ? 'none' : `linear-gradient(to bottom, transparent 0%, black ${fade.toFixed(2)}%)`
  return {
    top: `${((100 * i - above) / n).toFixed(3)}%`,
    height: `${(height / n).toFixed(3)}%`,
    WebkitMaskImage: mask,
    maskImage: mask,
  }
}

function imageStyle(level: Required<Level>): CSSProperties {
  return {
    objectPosition: level.focus,
    transformOrigin: level.focus,
    transform: level.zoom !== 1 ? `scale(${level.zoom})` : undefined,
  }
}

const shaftStyle = computed<CSSProperties>(() => ({
  height: `${levels.value.length * 100}%`,
  transform: `translateY(${(-100 * step.value) / Math.max(levels.value.length, 1)}%)`,
}))

/** Waar het merkteken op de dieptemeter staat, in procent van zijn hoogte. */
const depth = computed(() => (last.value === 0 ? 0 : (100 * step.value) / last.value))
</script>

<template>
  <div class="slidev-layout afdaling">
    <div class="afdaling-shaft" :style="shaftStyle">
      <figure
        v-for="(level, i) in levels"
        :key="i"
        class="afdaling-panel"
        :style="panelStyle(i)"
      >
        <img :src="level.src" :alt="level.label" :style="imageStyle(level)" />
      </figure>
    </div>

    <div class="afdaling-veil" :class="{ 'is-below': step === last && last > 0 }" />

    <div class="afdaling-title afdaling-title--boven deco" :class="{ 'is-on': step === 0 }">
      <slot />
    </div>
    <div
      v-if="last > 0"
      class="afdaling-title afdaling-title--beneden nouveau"
      :class="{ 'is-on': step === last }"
      aria-hidden="true"
    >
      <slot />
    </div>

    <div v-if="last > 0" class="afdaling-depth" aria-hidden="true">
      <span
        v-for="(level, i) in levels"
        :key="i"
        class="afdaling-depth-stop"
        :class="{
          'deco': i === 0,
          'nouveau': i === last,
          'is-current': i === step,
        }"
        :style="{ top: `${(100 * i) / last}%` }"
      >{{ level.label }}</span>
      <span class="afdaling-depth-mark" :style="{ top: `${depth}%` }" />
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.afdaling {
  padding: 0;
  background: var(--deco-ground);
}
.slidev-layout.afdaling::before,
.slidev-layout.afdaling::after {
  display: none;
}

/* ── De schacht — alle beelden als één strook ────────────────────── */
.afdaling-shaft {
  position: absolute;
  inset: 0 0 auto 0;
  background: linear-gradient(to bottom, var(--deco-ground), var(--nouveau-ground));
  transition: transform 1700ms cubic-bezier(0.65, 0, 0.3, 1);
}
.afdaling-panel {
  position: absolute;
  left: 0;
  right: 0;
  margin: 0;
  overflow: hidden;
}
.afdaling-panel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Een waas onder de titel, en onderaan het groene licht van Zaun. */
.afdaling-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom,
    color-mix(in srgb, var(--deco-ground) 55%, transparent) 0%,
    transparent 38%);
  transition: background 1200ms ease;
}
.afdaling-veil.is-below {
  background:
    radial-gradient(ellipse 70% 60% at 22% 88%,
      color-mix(in srgb, var(--nouveau-ground) 78%, transparent) 0%, transparent 70%),
    linear-gradient(to top,
      color-mix(in srgb, var(--nouveau-glow) 30%, transparent) 0%, transparent 40%);
}

/* ── De twee titels ──────────────────────────────────────────────────
   Dezelfde slot twee keer, elk in een cartouche van zijn register; de
   letter komt uit de tokens van `.deco` en `.nouveau` (styles/layout.css).
   Ze wisselen met een overvloeier, want een letter kan je niet animeren. */
.afdaling-title {
  position: absolute;
  z-index: 2;
  opacity: 0;
  transition: opacity 900ms ease, transform 1400ms cubic-bezier(0.65, 0, 0.3, 1);
  pointer-events: none;
}
.afdaling-title.is-on {
  opacity: 1;
  transition-delay: 500ms;
}
.afdaling-title :deep(h1) {
  margin: 0;
}
.afdaling-title :deep(p) {
  margin: var(--space-sm) 0 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 400;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-text-quiet);
}

/* Boven: een plaat in zwart lak, gecentreerd, met de gouden lijst met
   getrapte hoeken van het register erin en de zonnestraal — symmetrisch —
   onder de titel. */
.afdaling-title--boven {
  top: 2.4rem;
  left: 50%;
  width: min(44rem, 76%);
  transform: translate(-50%, -1.5rem);
  padding: var(--space-lg) var(--space-xl) var(--space-md);
  text-align: center;
  background: color-mix(in srgb, var(--deco-ground) 88%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--deco-gold) 35%, transparent);
}
.afdaling-title--boven::after {
  content: '';
  position: absolute;
  inset: 9px;
  pointer-events: none;
  background-color: var(--deco-gold);
  -webkit-mask: var(--deco-lijst-mask);
          mask: var(--deco-lijst-mask);
}
.afdaling-title--boven.is-on {
  transform: translate(-50%, 0);
}
.afdaling-title--boven :deep(h1) {
  font-size: 2.55rem;
  letter-spacing: 0.12em;
  line-height: 1.2;
}
.afdaling-title--boven :deep(h1)::after {
  content: '';
  display: block;
  width: 20rem;
  max-width: 100%;
  aspect-ratio: 480 / 36;
  margin: 0.45em auto 0;
  background-color: var(--deco-gold);
  -webkit-mask: var(--ornament-sunburst-sym) center / contain no-repeat;
          mask: var(--ornament-sunburst-sym) center / contain no-repeat;
}

/* Beneden: een organische cartouche linksonder, asymmetrisch afgerond,
   en de zweepslag eronder. */
.afdaling-title--beneden {
  left: 3.2rem;
  bottom: 3rem;
  max-width: 34rem;
  transform: translateY(1.5rem);
  padding: var(--space-md) var(--space-lg) var(--space-md) var(--space-lg);
  background: color-mix(in srgb, var(--nouveau-ground) 88%, transparent);
  border-radius: 3.5rem 0.6rem 3.5rem 0.6rem / 2.6rem 0.6rem 2.6rem 0.6rem;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--nouveau-green) 70%, transparent);
}
.afdaling-title--beneden.is-on {
  transform: translateY(0);
}
.afdaling-title--beneden :deep(h1) {
  font-size: 4.1rem;
  line-height: 0.98;
}
.afdaling-title--beneden :deep(h1)::after {
  content: '';
  display: block;
  width: 15rem;
  aspect-ratio: 252 / 40;
  margin-top: 0.2em;
  background-color: var(--nouveau-green);
  -webkit-mask: var(--ornament-whiplash) left center / contain no-repeat;
          mask: var(--ornament-whiplash) left center / contain no-repeat;
}

/* ── De dieptemeter ──────────────────────────────────────────────────
   Een verticale lijn rechts, met de namen van de verdiepingen in hun
   eigen letter, en een ruit die meezakt. */
.afdaling-depth {
  position: absolute;
  z-index: 2;
  right: 2.2rem;
  top: 12%;
  bottom: 12%;
  width: 1px;
  background: linear-gradient(to bottom, var(--deco-gold), var(--color-junction), var(--nouveau-green));
}
.afdaling-depth-stop {
  position: absolute;
  right: 0.9rem;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: var(--step--1);
  opacity: 0.75;
  padding: 0.1em 0.45em;
  background: color-mix(in srgb, var(--color-bg) 72%, transparent);
  transition: opacity 600ms ease;
}
.afdaling-depth-stop::after {
  content: '';
  position: absolute;
  right: -0.9rem;
  top: 50%;
  width: 0.5rem;
  height: 1px;
  background: currentColor;
}
.afdaling-depth-stop.deco {
  font-family: var(--font-deco);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--deco-gold);
}
.afdaling-depth-stop.nouveau {
  font-family: var(--font-nouveau);
  font-style: italic;
  font-size: var(--step-1);
  color: var(--nouveau-heading);
}
.afdaling-depth-stop.is-current {
  opacity: 1;
}
.afdaling-depth-mark {
  position: absolute;
  left: 0;
  width: 0.7rem;
  height: 0.7rem;
  background: var(--color-junction);
  transform: translate(-50%, -50%) rotate(45deg);
  transition: top 1700ms cubic-bezier(0.65, 0, 0.3, 1);
  box-shadow: 0 0 10px color-mix(in srgb, var(--color-junction) 70%, transparent);
}
</style>
