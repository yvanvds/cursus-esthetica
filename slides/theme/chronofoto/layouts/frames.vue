<!--
  Een reeks losse opnamen — de twaalf platen van Muybridge — eerst als
  contactvel, dan afgespeeld, dan stilgezet op één opname.

    klik 0   het contactvel: alle opnamen in een raster, genummerd
    klik 1   traag afspelen (`slow` beelden per seconde): je ziet nog platen
    klik 2   afspelen op `fast` beelden per seconde: je ziet een paard
    klik 3   stil op opname `hold`, met `holdLabel` eronder

  Bestaat omdat het argument van beweging 3 precies die overgang is: dezelfde
  twaalf stilstaande beelden worden beweging zodra ze snel genoeg op elkaar
  volgen, en het ene beeld dat het oog nooit zag zit er gewoon tussen. Een
  video laat alleen het resultaat zien; `triptych` alleen de platen.

  Gebruik:
    ---
    layout: frames
    pattern: /cursus-esthetica/images/beweging-en-dynamiek/muybridge-frames/frame-{n}.jpg
    count: 12        # opnamen op het contactvel; {n} loopt van 01 tot count
    play: 11         # opnamen die meespelen (de eerste `play`); standaard alle
    slow: 2
    fast: 12
    hold: 3          # de opname waarop klik 3 stilstaat (vanaf 1); 0 = geen
    holdLabel: alle vier de hoeven van de grond
    ---

    ## Optionele titel

  `play` bestaat omdat Muybridge meer opnam dan één galopsprong: de laatste
  plaat toont het paard in stilstand en hoort niet in de lus.

  De layout stapt zelf op `$clicks` en registreert zijn klikken met
  `useOwnClicks` (#93): 3 met `hold`, anders 2. De lus loopt op een timer
  zolang de slide op klik 1 of 2 staat en stopt bij unmount.

  Bij prefers-reduced-motion speelt er niets automatisch af: klik 1 en 2
  tonen dan de eerste opname groot, klik 3 de stilgezette. De docent kan de
  film nog altijd met de video op de volgende slide tonen.

  Thema-eigen (chronofoto).
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset, useOwnClicks } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    pattern: string
    count?: number
    play?: number
    slow?: number
    fast?: number
    hold?: number
    holdLabel?: string
  }>(),
  { count: 12, play: 0, slow: 2, fast: 12, hold: 0, holdLabel: '' },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const { $clicks } = useSlideContext()

const hasHold = computed(() => props.hold >= 1 && props.hold <= props.count)
const steps = computed(() => (hasHold.value ? 3 : 2))
useOwnClicks(() => steps.value)

const step = computed(() => Math.min(Math.max($clicks.value, 0), steps.value))

const frames = computed(() =>
  Array.from({ length: Math.max(props.count, 0) }, (_, i) =>
    resolveAsset(props.pattern.replace('{n}', String(i + 1).padStart(2, '0'))),
  ),
)

/** Het aantal opnamen in de lus. */
const loop = computed(() =>
  props.play >= 1 && props.play <= props.count ? props.play : props.count,
)

const tick = ref(0)
const reduced = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
}

function start(fps: number) {
  stop()
  if (reduced.value || fps <= 0 || loop.value < 2) return
  timer = setInterval(() => {
    tick.value = (tick.value + 1) % loop.value
  }, 1000 / fps)
}

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  watch(
    step,
    (s) => {
      if (s === 1) start(props.slow)
      else if (s === 2) start(props.fast)
      else stop()
      if (s === 0) tick.value = 0
    },
    { immediate: true },
  )
})

onBeforeUnmount(stop)

/** De opname die groot staat (vanaf 0). */
const current = computed(() => (step.value === 3 ? props.hold - 1 : tick.value))

const status = computed(() => {
  if (step.value === 1) return `${props.slow} beelden per seconde`
  if (step.value === 2) return `${props.fast} beelden per seconde`
  if (step.value === 3) return props.holdLabel
  return ''
})
</script>

<template>
  <div class="slidev-layout frames" :class="{ 'frames--headed': hasHeader }">
    <header v-if="hasHeader" class="frames-header">
      <slot />
    </header>

    <div class="frames-body">
      <!-- Het contactvel -->
      <ol v-if="step === 0" class="frames-sheet">
        <li v-for="(src, i) in frames" :key="i">
          <img :src="src" :alt="`opname ${i + 1}`" />
          <span class="frames-number">{{ String(i + 1).padStart(2, '0') }}</span>
        </li>
      </ol>

      <!-- De projectie: één opname groot, de reeks als strook eronder -->
      <div v-else class="frames-projector">
        <div class="frames-screen">
          <img
            v-for="(src, i) in frames"
            :key="i"
            :src="src"
            :alt="`opname ${i + 1}`"
            :class="{ 'is-current': i === current }"
          />
        </div>
        <div class="frames-meta">
          <span class="frames-count">opname {{ String(current + 1).padStart(2, '0') }}</span>
          <span class="frames-status">{{ status }}</span>
        </div>
        <ol class="frames-strip">
          <li
            v-for="(src, i) in frames"
            :key="i"
            :class="{ 'is-current': i === current, 'is-out': i >= loop }"
          >
            <img :src="src" alt="" />
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.frames {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl) calc(var(--space-lg) + var(--strip-height));
}
.slidev-layout.frames.frames--headed { grid-template-rows: auto minmax(0, 1fr); }
.frames-header :deep(h2) { margin-bottom: 0; font-size: var(--step-3); }

.frames-body { min-height: 0; display: flex; justify-content: center; }

/* ── Het contactvel ──────────────────────────────────────────────── */
.frames-sheet {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
  height: 100%;
  aspect-ratio: 4 * 550 / (3 * 356);
  max-width: 100%;
}
.frames-sheet li {
  position: relative;
  margin: 0;
  padding: 0;
  min-height: 0;
  line-height: 0;
}
.frames-sheet li::before { content: none; }
.frames-sheet img { width: 100%; height: 100%; object-fit: cover; display: block; }
.frames-number {
  position: absolute;
  left: 0.35rem;
  top: 0.3rem;
  padding: 0.05rem 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  line-height: 1.4;
  letter-spacing: 0.1em;
  color: var(--color-text);
  background: var(--color-accent);
}

/* ── De projectie ────────────────────────────────────────────────── */
.frames-projector {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  gap: 0.5rem;
  width: 100%;
  min-height: 0;
}
.frames-screen { position: relative; min-height: 0; }
/* Alle opnamen liggen op elkaar; alleen de huidige is zichtbaar. Zo hoeft
   de browser bij twaalf beelden per seconde niets te laden of te wisselen. */
.frames-screen img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  visibility: hidden;
}
.frames-screen img.is-current { visibility: visible; }

.frames-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.frames-count { color: var(--color-text-quiet); }
.frames-status { color: var(--color-accent-text); text-align: right; }

.frames-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.frames-strip li {
  margin: 0;
  padding: 0;
  line-height: 0;
  opacity: 0.35;
  border-top: 2px solid transparent;
}
.frames-strip li::before { content: none; }
.frames-strip li.is-current { opacity: 1; border-top-color: var(--color-accent); }
.frames-strip li.is-out { opacity: 0.12; }
.frames-strip img { width: 100%; display: block; }
</style>
