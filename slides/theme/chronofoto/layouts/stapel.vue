<!--
  Dezelfde losse opnamen als `frames`, maar nu per klik over elkaar gelegd op
  één plaat: wat Marey deed met één negatief, en wat Duchamp deed met verf.
  Op de laatste klik schuift het schilderij ernaast.

    klik 0          de eerste opname, alleen
    klik 1 … steps  telkens een paar opnamen erbij, elk een stap verder
    klik steps + 1  het werk uit `beside` verschijnt naast de plaat

  Bestaat omdat het scharnier van het hoofdstuk één zin is — "zodra beweging
  in plakjes gesneden kan worden, kan een kunstenaar die plakjes ook weer
  opstapelen" — en geen bestaande layout dat kan dóén. `compare` zet de
  plaat van Muybridge naast het doek en laat de klas de stap zelf maken; hier
  maakt de slide hem, met het materiaal van de vorige slide.

  Gebruik:
    ---
    layout: stapel
    pattern: /cursus-esthetica/images/beweging-en-dynamiek/muybridge-frames/frame-{n}.jpg
    count: 11          # de eerste `count` opnamen; {n} loopt van 01 tot count
    steps: 5           # over hoeveel klikken de stapel groeit
    shift: 7           # verschuiving per opname, in procent van één opname
    drop: 2.2          # zakking per opname, in procent (Duchamps trap daalt)
    beside: /cursus-esthetica/images/beweging-en-dynamiek/duchamp-1.jpg
    besideCaption: Marcel Duchamp, 1912
    ---

    ## Optionele titel

  De opnamen zijn foto's met een grijze muur achter het paard. Twaalf keer
  vermenigvuldigen maakt daar zwart van, dus een filter (grijswaarden, hard
  contrast) trekt de muur eerst naar wit en het silhouet naar zwart; daarna
  mengt elke opname met `multiply` op de plaat in de kleur van het papier.
  Alleen waar silhouetten overlappen wordt het donkerder. Dit is een
  bewerking van de opnamen, geen bestaande foto: de sprekersnotitie hoort
  dat te zeggen.

  De layout stapt zelf op `$clicks` en registreert zijn klikken met
  `useOwnClicks` (#93). Bij prefers-reduced-motion verschijnen de opnamen
  zonder overgang.

  Thema-eigen (chronofoto).
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset, useOwnClicks } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    pattern: string
    count?: number
    steps?: number
    shift?: number
    drop?: number
    beside?: string
    besideCaption?: string
  }>(),
  { count: 11, steps: 5, shift: 7, drop: 2.2, beside: '', besideCaption: '' },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const { $clicks } = useSlideContext()

const n = computed(() => Math.max(Math.round(props.count), 1))
const growSteps = computed(() => Math.min(Math.max(Math.round(props.steps), 1), Math.max(n.value - 1, 1)))
const total = computed(() => growSteps.value + (props.beside ? 1 : 0))
useOwnClicks(() => total.value)

const step = computed(() => Math.min(Math.max($clicks.value, 0), total.value))

/** Het aantal opnamen dat op de plaat ligt. */
const shown = computed(() => {
  const t = Math.min(step.value, growSteps.value) / growSteps.value
  return 1 + Math.round(t * (n.value - 1))
})

const showBeside = computed(() => !!props.beside && step.value > growSteps.value)

const frames = computed(() =>
  Array.from({ length: n.value }, (_, i) => ({
    src: resolveAsset(props.pattern.replace('{n}', String(i + 1).padStart(2, '0'))),
    style: {
      left: `${(i * props.shift * 100) / plateWidth.value}%`,
      top: `${(i * props.drop * 100) / plateHeight.value}%`,
      width: `${10000 / plateWidth.value}%`,
    },
  })),
)

/* De plaat in procenten van één opname: breed genoeg voor de hele stapel. */
const plateWidth = computed(() => 100 + (n.value - 1) * props.shift)
const plateHeight = computed(() => 100 + (n.value - 1) * props.drop)

/* Een opname is 550 × 356. */
const FRAME_RATIO = 550 / 356
const plateRatio = computed(() => (FRAME_RATIO * plateWidth.value) / plateHeight.value)

const besideSrc = computed(() => resolveAsset(props.beside))
</script>

<template>
  <div
    class="slidev-layout stapel"
    :class="{ 'stapel--headed': hasHeader, 'stapel--beside': showBeside }"
  >
    <header v-if="hasHeader" class="stapel-header">
      <slot />
    </header>

    <div class="stapel-body">
      <figure class="stapel-plate-wrap">
        <div class="stapel-plate" :style="{ aspectRatio: String(plateRatio) }">
          <img
            v-for="(frame, i) in frames"
            :key="i"
            :src="frame.src"
            alt=""
            :style="frame.style"
            :class="{ 'is-shown': i < shown }"
          />
        </div>
        <figcaption>{{ shown }} {{ shown === 1 ? 'opname' : 'opnamen' }} op één plaat</figcaption>
      </figure>

      <figure v-if="beside" class="stapel-beside">
        <img :src="besideSrc" :alt="besideCaption" />
        <figcaption v-if="besideCaption">{{ besideCaption }}</figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.stapel {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl) calc(var(--space-lg) + var(--strip-height));
}
.slidev-layout.stapel.stapel--headed { grid-template-rows: auto minmax(0, 1fr); }
.stapel-header :deep(h2) { margin-bottom: 0; font-size: var(--step-3); }

.stapel-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-height: 0;
  transition: gap 700ms ease;
}
.stapel--beside .stapel-body { gap: var(--space-lg); }

figure { margin: 0; min-width: 0; }
figcaption {
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-quiet);
}

.stapel-plate-wrap {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
}
/* De plaat: albuminepapier. `isolation` houdt de multiply binnen de plaat,
   zodat de opnamen met het papier mengen en niet met de zwarte grond. */
.stapel-plate {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  max-height: calc(100% - 2rem);
  background: var(--color-text);
}
.stapel-plate img {
  position: absolute;
  height: auto;
  mix-blend-mode: multiply;
  filter: grayscale(1) contrast(4) brightness(1.35);
  opacity: 0;
  transition: opacity 500ms ease;
}
.stapel-plate img.is-shown { opacity: 0.5; }

.stapel-beside {
  flex: 0 0 0;
  width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  opacity: 0;
  transition: flex-basis 700ms ease, opacity 700ms ease 200ms;
}
.stapel--beside .stapel-beside { flex-basis: 27%; width: auto; opacity: 1; }
.stapel-beside img {
  display: block;
  max-width: 100%;
  max-height: calc(100% - 2rem);
  object-fit: contain;
  object-position: left center;
}

@media (prefers-reduced-motion: reduce) {
  .stapel-body,
  .stapel-plate img,
  .stapel-beside { transition: none; }
}
</style>
