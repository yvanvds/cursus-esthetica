<!--
  Eén beeld, passend in zijn podium (zoals `object-fit: contain`), optioneel
  bijgesneden, met een kader dat strak om het getoonde deel ligt en een
  bijschrift dat precies onder dat deel staat.

  Geen layout maar een onderdeel van `plaat` en `vitrine` (legering). Het
  staat bewust niet in `components/`: Slidev registreert die map globaal, en
  dit is geen component voor in een slide.

  Waarom zelf rekenen in plaats van `useContainBox`: die past het hele beeld
  in. Hier kan een rand van het beeld weg (`crop`, in procent van het
  beeld): een ingebrande waarschuwing linksboven (`arcane-zaun-interieur`),
  zwarte balken die in het bestand zelf staan (`steampunk-rolstoel`). Het
  bestand blijft onaangeroerd; alleen de weergave snijdt. Het principe is
  dat van `useContainBox` (layouts-base/utils.ts, #77, #92): reken uit de
  natuurlijke maten welke rechthoek het beeld in het podium beslaat, en hang
  kader en bijschrift aan díé rechthoek, niet aan het vak van het element.

  - `crop`: `{ top, right, bottom, left }`, procenten van het beeld.
  - `frame`: '' | 'nouveau' | 'deco' | 'messing' — het kader uit
    styles/layout.css (`.frame--…`). Deco en messing hebben een rand van 3px
    buiten het beeld (`BLEED`), die gaat van het podium af.
  - `below`: px onder het beeld die vrij blijven voor het bijschrift (slot
    `caption`). Is het beeld smal (minder dan 55% van de podiumbreedte als
    het de volle hoogte krijgt), dan komt het bijschrift er niet onder maar
    náást, rechtsonder, zoals een museumlabel: anders wordt het bijschrift
    van een staand werk een smalle kolom van vijf regels, en krimpt het
    beeld voor ruimte die het niet nodig heeft.
  - `align`: waar het beeld horizontaal staat als het smaller is dan het
    podium.

  Het podium meet zich met de ResizeObserver uit `useContainBox`
  (`stageSize`): ongetransformeerde px, dezelfde eenheid als de slide. Beeld-
  pad door `resolveAsset`.
-->
<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import type { CSSProperties } from 'vue'
import { resolveAsset, useContainBox } from '../../layouts-base/utils'

export interface Crop {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    crop?: Crop
    frame?: '' | 'nouveau' | 'deco' | 'messing'
    below?: number
    align?: 'start' | 'center' | 'end'
  }>(),
  { alt: '', crop: () => ({}), frame: '', below: 0, align: 'center' },
)

const BLEED = 3

const stage = ref<HTMLElement | null>(null)
const { stageSize } = useContainBox(stage)

const nat = ref({ w: 0, h: 0 })
function onLoad(event: Event) {
  const img = event.target as HTMLImageElement
  nat.value = { w: img.naturalWidth, h: img.naturalHeight }
}

const src = computed(() => resolveAsset(props.src))

/** De bijsnede als fracties, begrensd zodat er altijd iets overblijft. */
const cut = computed(() => {
  const f = (v?: number) => Math.min(Math.max((v ?? 0) / 100, 0), 0.45)
  return { t: f(props.crop.top), r: f(props.crop.right), b: f(props.crop.bottom), l: f(props.crop.left) }
})

const bleed = computed(() => (props.frame === 'deco' || props.frame === 'messing' ? BLEED : 0))

const slots = useSlots()

/** Past het bijgesneden beeld in een podium van W × H. */
function fit(W: number, H: number) {
  const b = bleed.value
  const { t, r, l } = cut.value
  const cw = nat.value.w * (1 - l - r)
  const ch = nat.value.h * (1 - t - cut.value.b)
  if (!W || !H || !cw || !ch) return { left: 0, top: 0, width: W, height: H }
  const scale = Math.min((W - 2 * b) / cw, (H - 2 * b) / ch)
  const width = cw * scale
  const height = ch * scale
  const free = W - width
  const left = props.align === 'start' ? b : props.align === 'end' ? free - b : free / 2
  return { left, top: (H - height) / 2, width, height }
}

/** Bijschrift naast een smal beeld in plaats van eronder (zie de kop). */
const beside = computed(() => {
  if (!props.below || !slots.caption) return false
  const W = stageSize.value.width
  const full = fit(W, stageSize.value.height)
  return W > 0 && full.width / W < 0.55
})

/** De rechthoek van het getoonde (bijgesneden) beeld, in px t.o.v. het podium. */
const box = computed(() => {
  const W = stageSize.value.width
  const H = beside.value ? stageSize.value.height : Math.max(stageSize.value.height - props.below, 0)
  return fit(W, H)
})

const frameStyle = computed<CSSProperties>(() => {
  const b = bleed.value
  return {
    left: `${box.value.left - b}px`,
    top: `${box.value.top - b}px`,
    width: `${box.value.width + 2 * b}px`,
    height: `${box.value.height + 2 * b}px`,
  }
})

/* Het beeld in het venster: zo groot dat het bijgesneden deel het venster
   precies vult. Procenten van het venster, dus het klopt ook binnen een
   kader met padding of rand. */
const imageStyle = computed<CSSProperties>(() => {
  const { t, r, b, l } = cut.value
  const w = 1 - l - r
  const h = 1 - t - b
  return {
    width: `${100 / w}%`,
    height: `${100 / h}%`,
    left: `${(-l / w) * 100}%`,
    top: `${(-t / h) * 100}%`,
  }
})

const captionStyle = computed<CSSProperties>(() => {
  const b = bleed.value
  if (beside.value) {
    const left = box.value.left + box.value.width + b + 20
    return {
      left: `${left}px`,
      bottom: `${stageSize.value.height - (box.value.top + box.value.height + b)}px`,
      width: `${Math.max(Math.min(stageSize.value.width - left - 4, 300), 120)}px`,
    }
  }
  return {
    left: `${box.value.left}px`,
    top: `${box.value.top + box.value.height + b + 8}px`,
    width: `${box.value.width}px`,
  }
})
</script>

<template>
  <div ref="stage" class="crop-stage">
    <figure class="crop-frame" :class="frame ? ['frame', `frame--${frame}`] : []" :style="frameStyle">
      <div class="crop-window">
        <img class="crop-img" :src="src" :alt="alt" :style="imageStyle" @load="onLoad" />
      </div>
    </figure>
    <div v-if="$slots.caption" class="crop-caption" :style="captionStyle">
      <slot name="caption" />
    </div>
  </div>
</template>

<style scoped>
.crop-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.crop-frame {
  position: absolute;
  margin: 0;
  box-sizing: border-box;
}
.crop-window {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.crop-frame .crop-img {
  position: absolute;
  display: block;
  max-width: none;
  object-fit: fill;
  clip-path: none;
}
/* Deco: de getrapte hoeken op het venster, niet op het beeld — dat is bij
   een bijsnede groter dan het venster, en zijn hoeken liggen erbuiten. */
.crop-frame.frame--deco .crop-window {
  clip-path: polygon(
    0 24px, 12px 24px, 12px 12px, 24px 12px, 24px 0,
    calc(100% - 24px) 0, calc(100% - 24px) 12px, calc(100% - 12px) 12px, calc(100% - 12px) 24px, 100% 24px,
    100% calc(100% - 24px), calc(100% - 12px) calc(100% - 24px), calc(100% - 12px) calc(100% - 12px),
    calc(100% - 24px) calc(100% - 12px), calc(100% - 24px) 100%,
    24px 100%, 24px calc(100% - 12px), 12px calc(100% - 12px), 12px calc(100% - 24px), 0 calc(100% - 24px));
}
.crop-caption {
  position: absolute;
}
</style>
