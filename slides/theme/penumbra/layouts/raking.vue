<!--
  Eén werk met de lichtrichting eroverheen getekend: een bundel vanuit een
  bron buiten het kader, en daarna een scrim die alles buiten die bundel
  wegdrukt. Wat overblijft is wat het licht raakt.

  Bestaat omdat beweging 3 er letterlijk om vraagt — "een lichtbalk valt schuin
  door de scène en treft de uitgestoken hand van Christus, het verbaasde gezicht
  van Mattheüs, en niets meer" — en omdat geen enkele gedeelde layout iets over
  een beeld kan leggen: compare, triptych, detail, paired-reveal en quadrants
  zetten allemaal dingen náást elkaar.

  Thema-eigen (penumbra), zoals `vanishing-point` thema-eigen is in oculus. Het
  is dezelfde greep — een constructie over een werk tekenen — maar de
  constructie is hier de lichtval en niet de meetkunde.

  Gebruik:
    ---
    layout: raking
    image: /cursus-esthetica/images/licht-en-schaduw/caravaggio-1.jpg
    source: [96, -8]        # de bron, in % van het BEELDkader; mag buiten 0–100
    target: [42, 52]        # waar de bundel heen wijst; standaard het midden
    spread: 13              # halve openingshoek in graden, standaard 12
    caption: Caravaggio, De Roeping van Mattheüs, 1599–1600
    ---

  Klikken: 1 = de bundel, 2 = de scrim over de rest.

  De viewBox is 100×100 met preserveAspectRatio="none", net als in
  vanishing-point: de bundel vertrekt daardoor exact uit het opgegeven punt,
  maar de openingshoek op het scherm wijkt af van `spread` zodra het beeld niet
  vierkant is. Regel `spread` dus op het oog en niet met een gradenboog.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { resolveAsset } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    image: string
    source?: number[]
    target?: number[]
    spread?: number
    caption?: string
  }>(),
  { source: () => [100, 0], target: () => [50, 50], spread: 12, caption: '' },
)

const src = computed(() => resolveAsset(props.image))

const sx = computed(() => props.source[0] ?? 100)
const sy = computed(() => props.source[1] ?? 0)

/** Richting bron → doel, in graden. */
const heading = computed(() => {
  const dx = (props.target[0] ?? 50) - sx.value
  const dy = (props.target[1] ?? 50) - sy.value
  return (Math.atan2(dy, dx) * 180) / Math.PI
})

/**
 * Ver buiten het kader; de <svg> klipt zelf op zijn viewport, dus de bundel
 * hoeft niet netjes op de rand te eindigen. Dat scheelt de randberekening die
 * vanishing-point wél nodig heeft (daar moet elke straal precies op de rand
 * stoppen omdat er geen vlak maar lijnen getekend worden).
 */
function far(deg: number): string {
  const rad = (deg * Math.PI) / 180
  return `${(sx.value + 400 * Math.cos(rad)).toFixed(2)},${(sy.value + 400 * Math.sin(rad)).toFixed(2)}`
}

const cone = computed(
  () =>
    `${sx.value},${sy.value} ` +
    `${far(heading.value - props.spread)} ` +
    `${far(heading.value + props.spread)}`,
)

/**
 * Eén pad met twee subpaden en fill-rule evenodd: het buitenste vierkant vult,
 * de bundel stanst er een gat in. Goedkoper en robuuster dan een <mask>.
 */
const scrim = computed(() => {
  const points = cone.value.split(' ')
  return `M-100,-100 H200 V200 H-100 Z M${points[0]} L${points[1]} L${points[2]} Z`
})
</script>

<template>
  <div class="slidev-layout raking">
    <figure class="raking-frame">
      <img :src="src" :alt="caption" />

      <svg
        class="raking-overlay"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g v-click>
          <polygon class="raking-cone" :points="cone" />
        </g>
        <g v-click>
          <path class="raking-scrim" :d="scrim" fill-rule="evenodd" />
        </g>
      </svg>

      <figcaption v-if="caption">{{ caption }}</figcaption>
    </figure>
  </div>
</template>

<style scoped>
/* Shrink-to-fit op een inline-block, zodat de overlay precies het beeld dekt
   en niet de slide. Zelfde reden als in vanishing-point: daarom is dit een
   <img> en geen background-image. */
.slidev-layout.raking {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.slidev-layout.raking::before { display: none; }

.raking-frame {
  position: relative;
  display: inline-block;
  line-height: 0;
  max-width: 100%;
  max-height: 100%;
  margin: 0;
}

.raking-frame > img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.raking-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.raking-cone {
  fill: var(--color-accent);
  opacity: 0.16;
}

.raking-scrim {
  fill: #050505;
  opacity: 0.82;
}

.raking-frame > figcaption {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text);
  line-height: 1.4;
  background: linear-gradient(to top, rgba(14, 13, 11, 0.85), transparent);
  z-index: 2;
}
</style>
