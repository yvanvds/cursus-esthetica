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

  Twee vormen, allebei in % van het BEELDkader (mogen (ver) buiten 0–100):

  1. Een kegel uit één bron — `source`, `target`, `spread`:
    ---
    layout: raking
    image: /cursus-esthetica/images/licht-en-schaduw/caravaggio-1.jpg
    source: [140, 21]       # de bron; standaard [100, 0]
    target: [27, 50]        # waar de bundel heen wijst; standaard het midden
    spread: 3               # halve openingshoek in graden, standaard 12
    caption: Caravaggio, De Roeping van Mattheüs, 1599–1600
    ---

  2. Een vierhoek van een intrede naar een doel — `entry`, `reach`:
    ---
    layout: raking
    image: /cursus-esthetica/images/licht-en-schaduw/caravaggio-1.jpg
    entry: [[100, 5], [100, 30]]     # segment waar het licht binnenkomt
    reach: [[27, 41], [27, 60]]      # segment bij het doel; zijde i loopt entry[i] → reach[i]
    caption: Caravaggio, De Roeping van Mattheüs, 1599–1600
    ---
    Zonder `reach` lopen beide zijden naar `target`: een driehoek die op het
    doel eindigt.

  Klikken: 1 = de bundel, 2 = de scrim over de rest.

  De viewBox is 100×100 met preserveAspectRatio="none", net als in
  vanishing-point: de bundel vertrekt daardoor exact uit de opgegeven punten,
  maar de openingshoek op het scherm wijkt af van `spread` zodra het beeld niet
  vierkant is. Regel `spread` dus op het oog en niet met een gradenboog. De
  vierhoek heeft daar geen last van: al zijn hoekpunten staan in beeldprocenten.

  Een bron ver buiten het kader met een kleine `spread` geeft een bijna
  evenwijdige balk — zonlicht; een bron dichtbij met een grote `spread` een
  wig. Maar een kegel wordt vanuit zijn bron altijd bréder. Wil je dat de bundel
  breed binnenkomt en smal op zijn doel landt — bij Caravaggio: de hele
  verlichte muur aan de rechterrand, en dan alleen de hand van Christus en het
  gezicht van Mattheüs — dan kan dat alleen met `entry`/`reach` (#101).

  Voorbij het doel loopt de vierhoek door, net als de kegel: elke zijde wordt in
  haar eigen richting verlengd tot ver buiten het kader. Lopen de zijden naar
  elkaar toe, dan eindigt de bundel in hun snijpunt — een bundel die zich
  vernauwt, kruist zichzelf niet. Op het doel zélf eindigen zou een harde
  verticale snede door de figuur geven die het doel is.

  Het beeld past met `object-fit: contain` in een podium dat de slide vult; de
  werkelijk weergegeven beeldrechthoek komt uit `useContainBox` (layouts-base)
  en draagt de overlay en het bijschrift. Zie de kop van die composable voor
  waarom een inline-block-figure hier niet volstond (#77, #92).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { resolveAsset, useContainBox } from '../../layouts-base/utils'

type Pt = [number, number]

const props = withDefaults(
  defineProps<{
    image: string
    source?: number[]
    target?: number[]
    spread?: number
    entry?: number[][]
    reach?: number[][]
    caption?: string
  }>(),
  { source: () => [100, 0], target: () => [50, 50], spread: 12, caption: '' },
)

const src = computed(() => resolveAsset(props.image))

const stage = ref<HTMLElement | null>(null)
const { onImageLoad, boxStyle } = useContainBox(stage)

/** Hoe ver een zijde voorbij haar laatste punt doorloopt; ver buiten het kader. */
const FAR = 400

const pt = (p: number[] | undefined, fallback: Pt): Pt => [p?.[0] ?? fallback[0], p?.[1] ?? fallback[1]]
const fmt = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`

const source = computed(() => pt(props.source, [100, 0]))
const target = computed(() => pt(props.target, [50, 50]))

/** Richting bron → doel, in graden. */
const heading = computed(() => {
  const dx = target.value[0] - source.value[0]
  const dy = target.value[1] - source.value[1]
  return (Math.atan2(dy, dx) * 180) / Math.PI
})

/**
 * Ver buiten het kader; de <svg> klipt zelf op zijn viewport, dus de bundel
 * hoeft niet netjes op de rand te eindigen. Dat scheelt de randberekening die
 * vanishing-point wél nodig heeft (daar moet elke straal precies op de rand
 * stoppen omdat er geen vlak maar lijnen getekend worden).
 */
function far(deg: number): Pt {
  const rad = (deg * Math.PI) / 180
  return [source.value[0] + FAR * Math.cos(rad), source.value[1] + FAR * Math.sin(rad)]
}

/** Punt op de straal a → b, FAR voorbij a. */
function along(a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  return [a[0] + (FAR * dx) / len, a[1] + (FAR * dy) / len]
}

/**
 * Snijpunt van de lijnen a0→a1 en b0→b1, maar alleen als het op beide lijnen
 * vóórbij het tweede punt ligt — de zijden lopen dan naar elkaar toe en de
 * bundel eindigt daar. Anders (evenwijdig, of uiteenlopend) null.
 */
function focus(a0: Pt, a1: Pt, b0: Pt, b1: Pt): Pt | null {
  const ax = a1[0] - a0[0], ay = a1[1] - a0[1]
  const bx = b1[0] - b0[0], by = b1[1] - b0[1]
  const det = ax * by - ay * bx
  if (Math.abs(det) < 1e-9) return null
  const cx = b0[0] - a0[0], cy = b0[1] - a0[1]
  const t = (cx * by - cy * bx) / det
  const u = (cx * ay - cy * ax) / det
  if (t < 1 - 1e-9 || u < 1 - 1e-9) return null
  return [a0[0] + t * ax, a0[1] + t * ay]
}

/** De hoekpunten van de bundel, in beeldprocenten. */
const beam = computed<Pt[]>(() => {
  if (props.entry && props.entry.length >= 2) {
    const e0 = pt(props.entry[0], [100, 0])
    const e1 = pt(props.entry[1], [100, 100])
    const r0 = pt(props.reach?.[0], target.value)
    const r1 = pt(props.reach?.[1], target.value)
    const end = focus(e0, r0, e1, r1)
    return end ? [e0, end, e1] : [e0, along(e0, r0), along(e1, r1), e1]
  }
  return [source.value, far(heading.value - props.spread), far(heading.value + props.spread)]
})

const cone = computed(() => beam.value.map(fmt).join(' '))

/**
 * Eén pad met twee subpaden en fill-rule evenodd: het buitenste vierkant vult,
 * de bundel stanst er een gat in. Goedkoper en robuuster dan een <mask>.
 */
const scrim = computed(() => {
  const [first, ...rest] = beam.value.map(fmt)
  return `M-100,-100 H200 V200 H-100 Z M${first} ${rest.map((p) => `L${p}`).join(' ')} Z`
})
</script>

<template>
  <div class="slidev-layout raking">
    <div ref="stage" class="raking-stage">
      <img class="raking-image" :src="src" :alt="caption" @load="onImageLoad" />

      <figure class="raking-frame" :style="boxStyle">
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
  </div>
</template>

<style scoped>
.slidev-layout.raking {
  padding: var(--space-lg);
}

.slidev-layout.raking::before { display: none; }

/* Het podium vult wat de slide na padding overhoudt. Het beeld past er met
   `contain` in; `.raking-frame` krijgt de exacte rechthoek die het beeld
   werkelijk dekt, en draagt de overlay en het bijschrift. */
.raking-stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.raking-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.raking-frame {
  position: absolute;
  margin: 0;
  line-height: 0;
  pointer-events: none;
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
