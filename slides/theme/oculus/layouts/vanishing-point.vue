<!--
  Eén beeld, volledig in beeld, met een perspectiefconstructie die er op klik
  overheen wordt getekend: haarlijnen die samenkomen op een instelbaar punt,
  een horizon door dat punt, en een kruis op het punt zelf.

  Bestaat omdat het hoofdstuk er letterlijk om vraagt — "trek de lijnen van de
  trappen en de gewelven door: ze komen allemaal samen op één punt" — en omdat
  geen van de gedeelde layouts iets over een beeld heen kan leggen: `compare`,
  `paired-reveal` en `quadrants` zetten dingen naast elkaar.

  Thema-eigen (oculus): de constructie is het motief van dit thema, niet iets
  wat elk deck nodig heeft.

  Gebruik:
    ---
    layout: vanishing-point
    image: /cursus-esthetica/images/inleiding/school-of-athens.png
    focus: [51.5, 44.5]    # procenten van het BEELD, niet van de slide
    rays: 16               # optioneel, standaard 14
    label: verdwijnpunt    # optioneel, standaard 'verdwijnpunt'
    caption: Rafaël, De school van Athene, 1509–1511   # optioneel
    ---

  Klikken: 1 = de lijnen, 2 = de horizon, 3 = het punt met zijn label.

  Zodra de lijnen staan (klik 1) volgt de constructie de muisaanwijzer, zodat de
  docent hem live over het schilderij kan schuiven — dat laat ook zien wat er op
  álle andere plekken níét klopt. Een klik zet het punt vast, nog een klik maakt
  het weer vrij. `focus` is de startwaarde en de terugval: zonder muis (aanraking,
  export) staat de constructie gewoon waar de frontmatter zegt.

  Waarom hier JS zit en geen pure CSS:
  `max-height: 100%` op een <img> in een figure met automatische hoogte grijpt
  niet — die procentuele waarde heeft geen definitieve hoogte om tegen op te
  lossen. Het beeld puilde daardoor onder zijn eigen frame uit terwijl de overlay
  het frame dekte, en dan staat het verdwijnpunt stelselmatig te hoog (#77). Het
  beeld wordt nu met `object-fit: contain` in het podium gepast en de exacte
  weergaverechthoek wordt uitgerekend uit de natuurlijke afmetingen. Diezelfde
  rechthoek draagt de overlay én de muisberekening, dus ze kunnen per constructie
  niet meer uit elkaar lopen.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    image: string
    focus?: number[]
    rays?: number
    label?: string
    caption?: string
  }>(),
  { focus: () => [50, 50], rays: 14, label: 'verdwijnpunt', caption: '' },
)

const { $clicks } = useSlideContext()

const src = computed(() => resolveAsset(props.image))

/* ── De weergaverechthoek van het beeld ─────────────────────────────
   Het podium vult de slide; het beeld zit er met `contain` in gepast. Uit de
   natuurlijke verhouding volgt precies welk deel van het podium het beeld dekt,
   en dat is de doos waar alles verder op steunt. */
const stage = ref<HTMLElement | null>(null)
const stageW = ref(0)
const stageH = ref(0)
const natW = ref(0)
const natH = ref(0)

let observer: ResizeObserver | null = null

onMounted(() => {
  if (!stage.value) return
  observer = new ResizeObserver(([entry]) => {
    stageW.value = entry.contentRect.width
    stageH.value = entry.contentRect.height
  })
  observer.observe(stage.value)
})

onBeforeUnmount(() => observer?.disconnect())

function onImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  natW.value = img.naturalWidth
  natH.value = img.naturalHeight
}

const box = computed(() => {
  if (!stageW.value || !stageH.value || !natW.value || !natH.value)
    return { left: 0, top: 0, width: stageW.value, height: stageH.value }
  const scale = Math.min(stageW.value / natW.value, stageH.value / natH.value)
  const width = natW.value * scale
  const height = natH.value * scale
  return {
    left: (stageW.value - width) / 2,
    top: (stageH.value - height) / 2,
    width,
    height,
  }
})

const boxStyle = computed(() => ({
  left: `${box.value.left}px`,
  top: `${box.value.top}px`,
  width: `${box.value.width}px`,
  height: `${box.value.height}px`,
}))

/* ── Het punt ───────────────────────────────────────────────────────
   Vastgezet wint van de muis, de muis wint van de frontmatter. */
const hover = ref<{ x: number; y: number } | null>(null)
const pinned = ref<{ x: number; y: number } | null>(null)

const interactive = computed(() => $clicks.value >= 1)

const fx = computed(() => pinned.value?.x ?? hover.value?.x ?? props.focus[0] ?? 50)
const fy = computed(() => pinned.value?.y ?? hover.value?.y ?? props.focus[1] ?? 50)

const clamp = (v: number) => Math.min(100, Math.max(0, v))

/* Alleen muis en pen. Op een aanraakscherm gebeurt er niets en blijft `focus`
   staan — dat is de bedoelde terugval, geen omissie. */
function pointFrom(event: PointerEvent) {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return null
  const { left, top, width, height } = box.value
  if (!width || !height) return null
  const rect = (stage.value as HTMLElement).getBoundingClientRect()
  // De slide staat onder een CSS-transform; de rect is dus al geschaald, maar
  // de podiummaten in `box` niet. Vandaar de omrekening over de rectbreedte.
  const scale = rect.width / stageW.value
  const x = (event.clientX - rect.left - left * scale) / (width * scale)
  const y = (event.clientY - rect.top - top * scale) / (height * scale)
  return { x: clamp(x * 100), y: clamp(y * 100) }
}

function onPointerMove(event: PointerEvent) {
  if (!interactive.value || pinned.value) return
  const point = pointFrom(event)
  if (point) hover.value = point
}

function onPointerLeave() {
  hover.value = null
}

/* `click` komt in de browser als PointerEvent binnen, maar niet gegarandeerd —
   vandaar de terugval op de laatst bekende hoverpositie. stopPropagation houdt
   het vastzetten los van Slidevs eigen klik-op-de-slide-navigatie: één klik hoort
   hier het punt te parkeren, niet ook de volgende klikstap te openen. */
function onClick(event: PointerEvent) {
  if (!interactive.value) return
  event.stopPropagation()
  if (pinned.value) {
    pinned.value = null
    hover.value = pointFrom(event) ?? hover.value
    return
  }
  pinned.value = pointFrom(event) ?? hover.value
}

/**
 * Eindpunt van een straal vanuit (fx, fy) onder hoek `deg`, geknipt op de rand
 * van het 100×100-viewBox. De kleinste positieve t is de eerste rand die de
 * straal raakt; zonder die keuze schiet een lijn door de hoek naar buiten.
 */
function edgePoint(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  const ts: number[] = []
  if (Math.abs(dx) > 1e-9) ts.push(((dx > 0 ? 100 : 0) - fx.value) / dx)
  if (Math.abs(dy) > 1e-9) ts.push(((dy > 0 ? 100 : 0) - fy.value) / dy)
  const t = Math.min(...ts.filter(v => v > 0))
  return { x: fx.value + t * dx, y: fy.value + t * dy }
}

const lines = computed(() =>
  Array.from({ length: props.rays }, (_, i) => edgePoint((i * 360) / props.rays)),
)
</script>

<template>
  <div class="slidev-layout vanishing-point">
    <div
      ref="stage"
      class="vp-stage"
      :class="{ 'is-live': interactive && !pinned, 'is-pinned': !!pinned }"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @click="onClick"
    >
      <img class="vp-image" :src="src" :alt="caption" @load="onImageLoad" />

      <figure class="vp-frame" :style="boxStyle">
        <svg
          class="vp-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g v-click class="vp-rays">
            <line
              v-for="(p, i) in lines"
              :key="i"
              :x1="fx" :y1="fy" :x2="p.x" :y2="p.y"
            />
          </g>
          <g v-click class="vp-horizon">
            <line :x1="0" :y1="fy" :x2="100" :y2="fy" />
          </g>
        </svg>

        <div v-click class="vp-point" :style="{ left: `${fx}%`, top: `${fy}%` }">
          <span class="vp-point-label">{{ label }}</span>
        </div>

        <figcaption v-if="caption">{{ caption }}</figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.vanishing-point {
  padding: var(--space-lg);
}

/* Het podium vult wat de slide na padding overhoudt. Het beeld past er met
   `contain` in; `.vp-frame` krijgt daarna de exacte rechthoek die het beeld
   werkelijk dekt, en draagt de hele constructie. */
.vp-stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.vp-stage.is-live { cursor: crosshair; }
.vp-stage.is-pinned { cursor: pointer; }

.vp-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.vp-frame {
  position: absolute;
  margin: 0;
  line-height: 0;
  pointer-events: none;
}

.vp-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* vector-effect houdt de lijn haarfijn ondanks de niet-uniforme viewBox-schaal */
.vp-overlay line {
  vector-effect: non-scaling-stroke;
}

.vp-rays line {
  stroke: var(--color-accent);
  stroke-width: 1;
  opacity: 0.75;
}

.vp-horizon line {
  stroke: var(--color-text);
  stroke-width: 1;
  stroke-dasharray: 6 5;
  opacity: 0.65;
}

.vp-point {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 26px;
  height: 26px;
  pointer-events: none;
}

.vp-point::before,
.vp-point::after {
  content: '';
  position: absolute;
  background: var(--color-accent);
}

.vp-point::before {
  left: 50%; top: 0; bottom: 0; width: 2px; transform: translateX(-50%);
}

.vp-point::after {
  top: 50%; left: 0; right: 0; height: 2px; transform: translateY(-50%);
}

.vp-point-label {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-accent);
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 1px 6px var(--color-bg);
}

.vp-frame > figcaption {
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text);
  line-height: 1.4;
  background: linear-gradient(to top, rgba(19, 20, 23, 0.85), transparent);
}
</style>
