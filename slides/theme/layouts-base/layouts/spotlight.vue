<!--
  Eén beeld waarin per klik een zone oplicht terwijl de rest dimt, met een
  label naast de zone. Stap 0 is het hele beeld; klik k licht zone k op; met
  `finale: true` zet een laatste klik alle zones tegelijk omlijnd op het
  ongedimde beeld — de leeskaart.

  Bestaat omdat `detail` uitsneden náást het werk zet en zo het verband met
  de plek kwijtraakt: bij een muur vol tags is precies de plek het punt (wat
  onderaan staat was er eerst, wat overheen gaat is een statement). De docent
  leest hier het werk voor, zone na zone, zonder dat het beeld verspringt.
  Voor een muur, maar even goed voor de compositie van een schilderij, een
  partituurpagina of een plattegrond. Het is ook de "muur-lezer" uit de
  COMPONENT-KANDIDAAT-notitie in graffiti-en-street-art.mdx, in deckvorm.

  Gebruik:
    ---
    layout: spotlight
    image: /cursus-esthetica/images/graffiti-en-street-art/muur-1.jpg
    caption: Metrostation 116th Street, New York, mei 1973
    regions:
      - { x: 32, y: 70.5, w: 26, h: 15, label: de oudste laag }
      - { x: 32, y: 36,   w: 30, h: 43, label: "SKY, eroverheen", side: left }
    dim: 0.72        # optioneel, hoe donker de rest wordt (0–1)
    finale: true     # optioneel, extra laatste klik met alle zones
    ---

    ## Optionele titel

  `x`, `y`, `w`, `h` zijn procenten van het beeld zelf, niet van de slide.
  Meet ze op het bestand (bv. met een uitsnede), niet op het scherm.

  De zones liggen op het werkelijk getoonde beeld via `useContainBox`
  (utils.ts): het beeld vult het podium met `object-fit: contain`, en het
  frame krijgt de exacte rechthoek die het beeld dekt — welke verhouding het
  beeld ook heeft (#77, #92). De dimming is een enkele doos met een reusachtige
  box-shadow, geknipt op het frame; van zone naar zone schuift die doos
  geanimeerd, alsof het oog over de muur gaat.

  De layout registreert zijn klikken zelf (`regions.length`, plus één voor de
  finale, via `useOwnClicks`): er staat geen `v-click` in de template, en
  zonder registratie telt Slidev nul klikken en verlaat de pijltjestoets de
  slide zonder één zone te tonen (#93). Geen `clicks:` in de frontmatter
  nodig.

  Het label staat rechts van de zone en springt naar links als de zone tegen
  de rechterrand ligt (x + w > 70); per zone te overschrijven met
  `side: left | right | top | bottom` — nodig zodra zones elkaar raken en
  de leeskaart anders labels over elkaar zet. Labels en bijschrift staan op
  een strook in `--color-bg` zodat ze in een licht én een donker thema
  leesbaar zijn.

  Beeldpad door `resolveAsset` (zie utils.ts).
-->
<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import type { CSSProperties } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset, useContainBox, useOwnClicks } from '../utils'

type Side = 'left' | 'right' | 'top' | 'bottom'

interface Region {
  x: number
  y: number
  w: number
  h: number
  label?: string
  side?: Side
}

const props = withDefaults(
  defineProps<{
    image: string
    caption?: string
    regions?: Region[]
    dim?: number
    finale?: boolean
  }>(),
  { caption: '', regions: () => [], dim: 0.72, finale: false },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const { $clicks } = useSlideContext()

const total = computed(() => props.regions.length + (props.finale ? 1 : 0))

/* Zonder v-click in de template telt Slidev geen klikken; zie useOwnClicks. */
useOwnClicks(() => total.value)

const src = computed(() => resolveAsset(props.image))

const stage = ref<HTMLElement | null>(null)
const { onImageLoad, boxStyle } = useContainBox(stage)

/** 0 = het hele beeld, 1..n = zone n, n+1 = de finale. */
const step = computed(() => Math.min(Math.max($clicks.value, 0), total.value))
const isFinale = computed(() => props.finale && step.value === props.regions.length + 1)
const active = computed(() => (step.value >= 1 && !isFinale.value ? step.value - 1 : -1))

function rectStyle(r: Region): CSSProperties {
  return { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }
}

/** De dim-doos: op de actieve zone, anders het hele frame (en dan onzichtbaar). */
const dimStyle = computed<CSSProperties>(() => {
  const r = props.regions[active.value]
  const rect = r ? rectStyle(r) : { left: '0%', top: '0%', width: '100%', height: '100%' }
  return { ...rect, '--spotlight-dim': String(active.value >= 0 ? props.dim : 0) } as CSSProperties
})

function labelSide(r: Region): Side {
  return r.side ?? (r.x + r.w > 70 ? 'left' : 'right')
}
</script>

<template>
  <div class="slidev-layout spotlight" :class="{ 'spotlight--headed': hasHeader }">
    <header v-if="hasHeader" class="spotlight-header">
      <slot />
    </header>

    <div ref="stage" class="spotlight-stage">
      <img class="spotlight-image" :src="src" :alt="caption" @load="onImageLoad" />

      <div class="spotlight-frame" :style="boxStyle">
        <div class="spotlight-dim" :style="dimStyle" />

        <div
          v-for="(r, i) in regions"
          :key="i"
          class="spotlight-region"
          :class="{ 'is-active': i === active, 'is-finale': isFinale }"
          :style="rectStyle(r)"
        >
          <span v-if="r.label" class="spotlight-label" :class="`spotlight-label--${labelSide(r)}`">
            <span class="spotlight-label-no">{{ i + 1 }}</span>{{ r.label }}
          </span>
        </div>

        <figcaption v-if="caption" class="spotlight-caption">{{ caption }}</figcaption>
      </div>
    </div>
  </div>
</template>
