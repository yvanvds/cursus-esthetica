<!--
  Boven en beneden: een deco-kader bovenaan, een nouveau-kader onderaan,
  met een grondlijn ertussen.

  Bestaat omdat het hoofdstuk één beeld twee keer gebruikt en dat zelf
  aankondigt: in Metropolis wonen de denkers in deco-torens en werken de
  arbeiders ondergronds ("Boven licht, beneden stoom. Dat beeld komt zo
  dadelijk terug"), en in Arcane is dat beeld "een volledige
  stadsplattegrond geworden": Piltover deco boven, Zaun nouveau beneden.
  Dezelfde slidevorm in beweging 6 en in beweging 7 maakt die
  terugverwijzing zichtbaar zonder dat de docent ze moet uitspreken. Een
  `compare` zet twee beelden náást elkaar en beweert daarmee
  gelijkwaardigheid; hier gaat het om een stapeling.

  Thema-eigen (legering).

  Gebruik:
    ---
    layout: boven-beneden
    top:
      image: /cursus-esthetica/images/art-nouveau-en-deco/metropolis-2.jpg
      label: boven
      caption: De Neue Turm Babel, setfoto, 1926
    bottom:
      image: /cursus-esthetica/images/art-nouveau-en-deco/metropolis-3.jpg
      label: beneden
      caption: Arbeiders in de Unterstadt, setfoto, 1926
    reveal: true     # optioneel: de onderste helft verschijnt bij een klik
    ---

    Boven licht, beneden stoom.

  `top` en `bottom` zijn elk `{ image, label?, caption? }`. Elke helft draagt
  haar register (`deco` boven, `nouveau` beneden) als klasse, met grond,
  letter en kader. Het kader omsluit het beeld: de hoogte ligt vast op de
  band, de breedte volgt uit de verhouding van het beeld — niets wordt
  bijgesneden, tenzij het beeld breder is dan de band toelaat. Het beeld
  boven staat links, het beeld beneden rechts: het oog zakt in een Z.

  De standaardslot staat op de grondlijn tussen beide helften (een korte
  regel; leeg laten mag). Met `reveal: true` krijgt de onderste helft een
  `v-click`: de klas ziet eerst alleen boven, en daalt dan af. Twee takken
  in de template, omdat `v-click` geen waarde kent die hem uitschakelt
  (zelfde reden als in triptych.vue). Beeldpaden door `resolveAsset`.

  `magnify: true` (#170): klik 1 zet het beeld boven groot, klik 2 het beeld
  beneden, zonder label en bijschrift, met het andere als strook aan de rand;
  klik 3 keert terug naar beide helften. Elk beeld beweegt als zijn eigen
  helft (registerklasse op het vergrote kader: deco boven, nouveau beneden).
  Gedeeld met triptych: `useMagnify` en MagnifyLayer uit layouts-base.
  `magnify` vervangt `reveal`.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { resolveAsset, useMagnify } from '../../layouts-base/utils'
import type { MagnifyItem } from '../../layouts-base/utils'
import MagnifyLayer from '../../layouts-base/parts/MagnifyLayer.vue'

interface Half {
  image?: string
  label?: string
  caption?: string
}

const props = withDefaults(
  defineProps<{
    top?: Half
    bottom?: Half
    reveal?: boolean
    magnify?: boolean
  }>(),
  { top: () => ({}), bottom: () => ({}), reveal: false, magnify: false },
)

const slots = useSlots()
const hasSeam = computed(() => !!slots.default)

function half(h: Half, fallback: string) {
  return {
    src: h.image ? resolveAsset(h.image) : '',
    label: h.label ?? fallback,
    caption: h.caption ?? '',
  }
}
const boven = computed(() => half(props.top, 'boven'))
const beneden = computed(() => half(props.bottom, 'beneden'))

/* Alleen de helften met een beeld; de index is die van de bron in de slide. */
const magnifyItems = computed<MagnifyItem[]>(() => [
  ...(props.top.image ? [{ src: props.top.image, alt: boven.value.caption, register: 'deco' }] : []),
  ...(props.bottom.image ? [{ src: props.bottom.image, alt: beneden.value.caption, register: 'nouveau' }] : []),
])
const { active, rootAttrs } = useMagnify(() => props.magnify, () => magnifyItems.value.length)
</script>

<template>
  <div class="slidev-layout boven-beneden" v-bind="rootAttrs">
    <section class="bb-band bb-band--boven deco">
      <figure v-if="boven.src" class="frame frame--deco bb-frame" :data-magnify-source="magnify ? 0 : undefined">
        <img :src="boven.src" :alt="boven.caption" />
      </figure>
      <div class="bb-text">
        <p class="register-label">{{ boven.label }}</p>
        <p v-if="boven.caption" class="bb-caption">{{ boven.caption }}</p>
      </div>
    </section>

    <div class="bb-ground" :class="{ 'bb-ground--labelled': hasSeam }">
      <div v-if="hasSeam" class="bb-ground-text"><slot /></div>
    </div>

    <template v-if="reveal && !magnify">
      <section v-click class="bb-band bb-band--beneden nouveau">
        <div class="bb-text">
          <p class="register-label">{{ beneden.label }}</p>
          <p v-if="beneden.caption" class="bb-caption">{{ beneden.caption }}</p>
        </div>
        <figure v-if="beneden.src" class="frame frame--nouveau bb-frame">
          <img :src="beneden.src" :alt="beneden.caption" />
        </figure>
      </section>
    </template>
    <template v-else>
      <section class="bb-band bb-band--beneden nouveau">
        <div class="bb-text">
          <p class="register-label">{{ beneden.label }}</p>
          <p v-if="beneden.caption" class="bb-caption">{{ beneden.caption }}</p>
        </div>
        <figure
          v-if="beneden.src"
          class="frame frame--nouveau bb-frame"
          :data-magnify-source="magnify ? (boven.src ? 1 : 0) : undefined"
        >
          <img :src="beneden.src" :alt="beneden.caption" />
        </figure>
      </section>
    </template>

    <MagnifyLayer v-if="magnify" :items="magnifyItems" :active="active" />
  </div>
</template>

<style scoped>
.slidev-layout.boven-beneden {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
  padding: 0;
  background: var(--nouveau-ground);
}
.slidev-layout.boven-beneden::before,
.slidev-layout.boven-beneden::after {
  display: none;
}

.bb-band {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  min-height: 0;
  padding: 1.6rem var(--space-xl);
  background: var(--color-bg);
  overflow: hidden;
}
.bb-band--beneden {
  justify-content: flex-end;
  text-align: right;
  background:
    radial-gradient(ellipse 60% 120% at 100% 100%,
      color-mix(in srgb, var(--nouveau-glow) 30%, transparent), transparent 70%),
    var(--color-bg);
}

/* Boven: de zonnestraal waaiert op vanaf de grondlijn. */
.bb-band--boven::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0;
  background: repeating-conic-gradient(from -90deg at 50% 100%,
    color-mix(in srgb, var(--deco-gold) 10%, transparent) 0deg 0.6deg,
    transparent 0.6deg 5deg);
  -webkit-mask-image: radial-gradient(ellipse 70% 120% at 50% 100%, black 25%, transparent 75%);
          mask-image: radial-gradient(ellipse 70% 120% at 50% 100%, black 25%, transparent 75%);
}
/* Beneden: de zweepslag kruipt onder de grondlijn door. */
.bb-band--beneden::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -8%;
  top: 2%;
  width: 90%;
  aspect-ratio: 252 / 40;
  background-color: color-mix(in srgb, var(--nouveau-green) 13%, transparent);
  -webkit-mask: var(--ornament-whiplash) center / contain no-repeat;
          mask: var(--ornament-whiplash) center / contain no-repeat;
  transform: scaleY(-1) rotate(-3deg);
}

/* Het kader omsluit het beeld: hoogte uit de band, breedte uit de
   verhouding van het beeld, en nooit breder dan twee derde van de band. */
.bb-frame {
  flex: 0 1 auto;
  height: 100%;
  max-width: 66%;
}
.bb-frame img {
  width: auto;
  max-width: 100%;
}

.bb-text {
  flex: 0 1 18rem;
  min-width: 0;
}
.boven-beneden .bb-band--boven .register-label {
  font-size: 2.1rem;
  letter-spacing: 0.2em;
}
.boven-beneden .bb-band--beneden .register-label {
  font-size: 3.2rem;
}
.boven-beneden .bb-band--beneden .register-label::after {
  margin-left: auto;
  transform: scaleX(-1);
}
.bb-caption {
  margin: var(--space-sm) 0 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.45;
  color: var(--color-text-quiet);
}

/* De grondlijn: waar Piltover ophoudt en Zaun begint. Een lijn in de
   mengkleur over de volle breedte; met een regel erop staat die in het
   midden, op een strook die de lijn onderbreekt. */
.bb-ground {
  position: relative;
  height: 1px;
  background: var(--color-junction);
}
.bb-ground--labelled {
  height: 2.6rem;
  background:
    linear-gradient(var(--color-junction), var(--color-junction)) center / 100% 1px no-repeat,
    linear-gradient(to bottom, var(--deco-ground), var(--nouveau-ground));
  display: flex;
  align-items: center;
  justify-content: center;
}
.bb-ground-text {
  padding: 0 1.2em;
  background: linear-gradient(to bottom, var(--deco-ground), var(--nouveau-ground));
}
.bb-ground-text :deep(p) {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--neutral-text);
}
</style>
