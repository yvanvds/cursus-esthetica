<!--
  De laag die per klik één beeld van een slide vergroot (`magnify: true`,
  #170): het vergrote beeld en de strook met kleine beelden. Geen layout
  maar een onderdeel ervan; het staat bewust niet in `components/`, want
  Slidev registreert die map globaal en dit is geen component voor in een
  slide. `triptych`, `compare`, `detail` en de legering-layouts `vitrine`,
  `tussenstand` en `boven-beneden` gebruiken het, samen met `useMagnify`
  uit ../utils (klikstappen, staat, `data-magnify` op de root).

  - Het vergrote beeld past `contain` in het podium, zonder bijsnijden en
    zonder bijschrift. Het kader is een doos van precies die maat (de
    rekensom van `useContainBox`, #77, #92): wat een thema eromheen tekent,
    ligt strak om het getoonde beeld. Een `crop` (procenten van het beeld,
    zoals in legering) snijdt alleen de weergave bij.
  - Elk beeld staat op zijn eigen formaat in de DOM, niet geschaald. De
    beweging is een `transform` die vanuit de bron vertrekt en eindigt op
    `none` (fill `backwards`): na de animatie rastert Chrome het beeld op
    zijn echte maat, dus het blijft niet wazig hangen zoals bij een
    vergroting die op `scale()` eindigt.
  - De bron: bij het inzoomen vanuit het overzicht het beeld in de slide
    (het element met `data-magnify-source="i"`), van het ene beeld naar het
    volgende de kleine versie in de strook. Terug gaat het beeld naar
    dezelfde plek. `--magnify-dx`, `--magnify-dy` en `--magnify-s` op het
    kader zijn die vertrekplek; de keyframes van het thema lezen ze.
  - Animaties lopen pas na de eerste klik (`is-live`): een slide die op
    `?clicks=2` opent, of de preview in de presenter, staat er meteen.

  Tokens (allemaal optioneel, zie slides/README.md): `--magnify-keyframes`,
  `--magnify-duration`, `--magnify-easing`, `--magnify-leave-*`,
  `--magnify-fade-*`, `--magnify-inset`, `--magnify-bleed`,
  `--magnify-strip-width`, `--magnify-strip-gap`, `--magnify-thumb-dim`.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { fitContain, resolveAsset } from '../utils'
import type { MagnifyItem, Rect } from '../utils'

const props = defineProps<{
  items: MagnifyItem[]
  /** Het vergrote beeld, 1 … n; 0 is het overzicht. */
  active: number
}>()

const layer = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const strip = ref<HTMLElement | null>(null)

/* Podium en strook meten zich in ongetransformeerde px, dezelfde eenheid als
   de slide (de ResizeObserver ziet de schaal van Slidev niet). */
const stageSize = reactive({ w: 0, h: 0 })
const stripSize = reactive({ w: 0, h: 0 })
let observer: ResizeObserver | null = null

onMounted(() => {
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const size = entry.target === stage.value ? stageSize : stripSize
      size.w = entry.contentRect.width
      size.h = entry.contentRect.height
    }
  })
  if (stage.value) observer.observe(stage.value)
  if (strip.value) observer.observe(strip.value)
})
onBeforeUnmount(() => observer?.disconnect())

const natural = ref<{ w: number; h: number }[]>([])
function onLoad(i: number, event: Event) {
  const img = event.target as HTMLImageElement
  const next = natural.value.slice()
  next[i] = { w: img.naturalWidth, h: img.naturalHeight }
  natural.value = next
}

const srcs = computed(() => props.items.map(item => resolveAsset(item.src)))

/** De bijsnede als fracties, begrensd zoals in CropFigure. */
const cuts = computed(() =>
  props.items.map((item) => {
    const f = (v?: number) => Math.min(Math.max((v ?? 0) / 100, 0), 0.45)
    const c = item.crop ?? {}
    return { t: f(c.top), r: f(c.right), b: f(c.bottom), l: f(c.left) }
  }),
)

/** Breedte gedeeld door hoogte van het getoonde deel; 0 zolang onbekend. */
const aspects = computed(() =>
  props.items.map((_, i) => {
    const nat = natural.value[i]
    const c = cuts.value[i]
    if (!nat?.w || !nat.h) return 0
    return (nat.w * (1 - c.l - c.r)) / (nat.h * (1 - c.t - c.b))
  }),
)

/** Het vergrote beeld per item, in px t.o.v. het podium. */
const frames = computed<Rect[]>(() =>
  aspects.value.map(a => fitContain({ left: 0, top: 0, width: stageSize.w, height: stageSize.h }, a)),
)

/** De kleine beelden: gestapeld, verticaal gecentreerd in de strook. */
const GAP = 10
const thumbs = computed<Rect[]>(() => {
  const n = props.items.length
  if (!n || !stripSize.w || !stripSize.h)
    return props.items.map(() => ({ left: 0, top: 0, width: 0, height: 0 }))
  const cell = Math.min((stripSize.h - (n - 1) * GAP) / n, stripSize.w * 1.6)
  const fitted = aspects.value.map(a => fitContain({ left: 0, top: 0, width: stripSize.w, height: cell }, a || 1))
  let top = (stripSize.h - fitted.reduce((sum, r) => sum + r.height, 0) - (n - 1) * GAP) / 2
  return fitted.map((r) => {
    const rect = { ...r, top }
    top += r.height + GAP
    return rect
  })
})

const px = (r: Rect | undefined): CSSProperties =>
  r ? { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` } : {}

/** Het beeld in zijn venster, zo groot dat het bijgesneden deel het vult. */
function windowImage(i: number): CSSProperties {
  const { t, r, b, l } = cuts.value[i]
  const w = 1 - l - r
  const h = 1 - t - b
  return { width: `${100 / w}%`, height: `${100 / h}%`, left: `${(-l / w) * 100}%`, top: `${(-t / h) * 100}%` }
}

/* ── Beweging ─────────────────────────────────────────────────────────── */

const live = ref(false)
const leaving = ref(-1)
const motion = ref<Record<number, { dx: number; dy: number; s: number }>>({})

/** Inhoudsdoos van een element t.o.v. het podium, in ongetransformeerde px.
    De padding gaat eraf: een bron als `.vitrine-stage` houdt onderaan ruimte
    vrij, en het beeld staat in wat overblijft. */
function relativeRect(el: Element | null | undefined): Rect | null {
  if (!el || !stage.value || !stageSize.w) return null
  const s = stage.value.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const k = s.width / stageSize.w || 1
  if (!r.width || !r.height) return null
  const cs = getComputedStyle(el)
  const pad = (v: string) => Number.parseFloat(v) || 0
  const [pt, pr, pb, pl] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(pad)
  return {
    left: (r.left - s.left) / k + pl,
    top: (r.top - s.top) / k + pt,
    width: r.width / k - pl - pr,
    height: r.height / k - pt - pb,
  }
}

/** Waar beeld i vandaan komt of naartoe gaat: de strook, of de slide zelf. */
function placeOf(i: number, inStrip: boolean): Element | null {
  if (inStrip) return strip.value?.children[i] ?? null
  return layer.value?.parentElement?.querySelector(`[data-magnify-source="${i}"]`) ?? null
}

/** Zet de vertrekplek (of eindplek) van kader i als translate + scale. */
function anchor(i: number, el: Element | null) {
  const box = relativeRect(el)
  const target = frames.value[i]
  const next = { ...motion.value }
  delete next[i]
  if (box && target?.width && aspects.value[i]) {
    const from = fitContain(box, aspects.value[i])
    next[i] = {
      dx: from.left + from.width / 2 - (target.left + target.width / 2),
      dy: from.top + from.height / 2 - (target.top + target.height / 2),
      s: from.width / target.width,
    }
  }
  motion.value = next
}

/* `flush: 'pre'` (de standaard): de callback loopt vóór de DOM bijwerkt, dus
   het overzicht of de strook staat nog waar het stond en is meetbaar. */
watch(
  () => props.active,
  (now, before) => {
    if (now > 0) anchor(now - 1, placeOf(now - 1, before > 0))
    if (before > 0) anchor(before - 1, placeOf(before - 1, now > 0))
    leaving.value = before > 0 ? before - 1 : -1
    live.value = true
  },
)

function frameStyle(i: number): CSSProperties {
  const m = motion.value[i]
  return {
    ...px(frames.value[i]),
    ...(m ? { '--magnify-dx': `${m.dx}px`, '--magnify-dy': `${m.dy}px`, '--magnify-s': String(m.s) } : {}),
  }
}
</script>

<template>
  <div ref="layer" class="magnify-layer" :class="{ 'is-open': active > 0, 'is-live': live }">
    <div ref="stage" class="magnify-stage">
      <figure
        v-for="(item, i) in items"
        :key="i"
        class="magnify-frame"
        :class="[item.register, { 'is-active': i === active - 1, 'is-leaving': i === leaving && i !== active - 1 }]"
        :style="frameStyle(i)"
      >
        <div class="magnify-window">
          <img :src="srcs[i]" :alt="item.alt ?? ''" :style="windowImage(i)" @load="onLoad(i, $event)" />
        </div>
      </figure>
    </div>
    <div ref="strip" class="magnify-strip" aria-hidden="true">
      <div
        v-for="(_, i) in items"
        :key="i"
        class="magnify-thumb"
        :class="{ 'is-active': i === active - 1 }"
        :style="px(thumbs[i])"
      >
        <div class="magnify-window">
          <img :src="srcs[i]" alt="" :style="windowImage(i)" />
        </div>
      </div>
    </div>
  </div>
</template>
