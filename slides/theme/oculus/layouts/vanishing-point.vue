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
    focus: [50, 46]        # procenten van het BEELDkader, niet van de slide
    rays: 16               # optioneel, standaard 14
    label: verdwijnpunt    # optioneel, standaard 'verdwijnpunt'
    caption: Rafaël, De school van Athene, 1509–1511   # optioneel
    ---

  Klikken: 1 = de lijnen, 2 = de horizon, 3 = het punt met zijn label.
-->
<script setup lang="ts">
import { computed } from 'vue'
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

const src = computed(() => resolveAsset(props.image))
const fx = computed(() => props.focus[0] ?? 50)
const fy = computed(() => props.focus[1] ?? 50)

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
    <figure class="vp-frame">
      <img :src="src" :alt="caption" />

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
</template>

<style scoped>
/* De figure krimpt tot de werkelijk gerenderde beeldmaat (shrink-to-fit op een
   inline-block), zodat de overlay precies het beeld dekt en niet de slide. Dat
   is de hele reden dat het beeld hier een <img> is en geen background-image. */
.slidev-layout.vanishing-point {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.vp-frame {
  position: relative;
  display: inline-block;
  line-height: 0;
  max-width: 100%;
  max-height: 100%;
  margin: 0;
}

.vp-frame > img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
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
