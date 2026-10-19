<!--
  De tussenstand: twee antwoorden op één machine, naast elkaar — nouveau
  links, deco rechts, met een naad in de mengkleur ertussen.

  Bestaat omdat het hoofdstuk hier letterlijk omslaat. Op de site loopt de
  eerste alinea van "Tussenstand" in twee kolommen, nouveau links en deco
  rechts, met een haarlijn in `--color-junction` (#131). Het deck doet
  hetzelfde op slidemaat: elke helft draagt haar eigen register — grond,
  letter, kader, ornament — en de vraag die blijft staan komt over de naad
  heen, als één regel die bij geen van beide stijlen hoort.

  Thema-eigen (legering).

  Gebruik:
    ---
    layout: tussenstand
    left:
      image: /cursus-esthetica/images/art-nouveau-en-deco/tassel-1.jpg
      caption: Horta, Hôtel Tassel, 1893
      focus: 40% 40%
    right:
      image: /cursus-esthetica/images/art-nouveau-en-deco/chrysler-2.jpg
      caption: Van Alen, Chrysler Building, 1930
    ---

    ::nouveau::
    Verberg de machine onder een bladerdek.

    ::deco::
    Zet de machine op een sokkel.

    ::default::
    <v-click>Wie won er mét de machine — en wie verloor?</v-click>

  `left` en `right` zijn elk `{ image, caption?, focus?, label? }`; `label`
  staat standaard op "art nouveau" en "art deco". Het beeld vult zijn kader
  (`cover`, met `focus` als object-position): dit is een vergelijking van
  twee houdingen, de werken stonden eerder in de les al volledig. De
  standaardslot is de regel over de naad; leeg laten mag. Klikken komen uit
  de slot-inhoud (`v-click`), de layout heeft er zelf geen. Beeldpaden door
  `resolveAsset`.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { resolveAsset } from '../../layouts-base/utils'

interface Side {
  image?: string
  caption?: string
  focus?: string
  label?: string
}

const props = withDefaults(
  defineProps<{
    left?: Side
    right?: Side
  }>(),
  { left: () => ({}), right: () => ({}) },
)

const slots = useSlots()
const hasSeam = computed(() => !!slots.default)

function side(s: Side, fallback: string) {
  return {
    src: s.image ? resolveAsset(s.image) : '',
    caption: s.caption ?? '',
    focus: s.focus ?? '50% 50%',
    label: s.label ?? fallback,
  }
}
const nouveau = computed(() => side(props.left, 'art nouveau'))
const deco = computed(() => side(props.right, 'art deco'))
</script>

<template>
  <div class="slidev-layout tussenstand" :class="{ 'tussenstand--seamed': hasSeam }">
    <section class="ts-half ts-half--nouveau nouveau">
      <p class="register-label">{{ nouveau.label }}</p>
      <figure v-if="nouveau.src" class="frame frame--nouveau ts-frame">
        <img :src="nouveau.src" :alt="nouveau.caption" :style="{ objectPosition: nouveau.focus }" />
      </figure>
      <div class="ts-statement"><slot name="nouveau" /></div>
      <p v-if="nouveau.caption" class="ts-caption">{{ nouveau.caption }}</p>
    </section>

    <div class="ts-junction" aria-hidden="true" />

    <section class="ts-half ts-half--deco deco">
      <p class="register-label">{{ deco.label }}</p>
      <figure v-if="deco.src" class="frame frame--deco ts-frame">
        <img :src="deco.src" :alt="deco.caption" :style="{ objectPosition: deco.focus }" />
      </figure>
      <div class="ts-statement"><slot name="deco" /></div>
      <p v-if="deco.caption" class="ts-caption">{{ deco.caption }}</p>
    </section>

    <div v-if="hasSeam" class="ts-seam">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.tussenstand {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  padding: 0;
  background: var(--deco-ground);
}
.slidev-layout.tussenstand::before,
.slidev-layout.tussenstand::after {
  display: none;
}

.ts-half {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  background: var(--color-bg);
  overflow: hidden;
}
.tussenstand--seamed .ts-half {
  padding-bottom: 5.4rem;
}

/* Nouveau: het groene licht van boven links en de zweepslag onderaan,
   zoals op de grond van het register; deco: de zonnestraal van onder het
   midden. Zelfde ornamenten, op de maat van een halve slide. */
.ts-half--nouveau {
  background:
    radial-gradient(ellipse 90% 60% at 0% 0%,
      color-mix(in srgb, var(--nouveau-glow) 28%, transparent), transparent 70%),
    var(--color-bg);
  text-align: left;
}
.ts-half--nouveau::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -10%;
  bottom: 6%;
  width: 130%;
  aspect-ratio: 252 / 40;
  background-color: color-mix(in srgb, var(--nouveau-green) 12%, transparent);
  -webkit-mask: var(--ornament-whiplash) center / contain no-repeat;
          mask: var(--ornament-whiplash) center / contain no-repeat;
  transform: rotate(-6deg);
}
.ts-half--deco {
  text-align: right;
}
.ts-half--deco::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0;
  background: repeating-conic-gradient(from -90deg at 50% 120%,
    color-mix(in srgb, var(--deco-gold) 11%, transparent) 0deg 0.7deg,
    transparent 0.7deg 6deg);
  -webkit-mask-image: radial-gradient(ellipse 90% 95% at 50% 120%, black 30%, transparent 80%);
          mask-image: radial-gradient(ellipse 90% 95% at 50% 120%, black 30%, transparent 80%);
}
.ts-half--deco .register-label::after {
  margin-left: auto;
  transform: scaleX(-1);
}

.ts-frame {
  width: 100%;
  height: 100%;
}
.ts-half--deco .ts-frame {
  justify-self: end;
}

.ts-statement :deep(p) {
  margin: 0;
  font-size: var(--step-2);
  line-height: 1.3;
  color: var(--color-text);
}
.ts-half--nouveau .ts-statement :deep(p) {
  font-family: var(--font-nouveau);
  font-style: italic;
  font-size: calc(var(--step-2) * 1.25);
}
.ts-half--deco .ts-statement :deep(p) {
  font-family: var(--font-deco);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: calc(var(--step-1) * 1.02);
  line-height: 1.45;
}
.ts-caption {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.4;
  color: var(--color-text-quiet);
}

/* De naad: een haarlijn in de mengkleur van groen en goud. */
.ts-junction {
  background: linear-gradient(to bottom, transparent, var(--color-junction) 12%, var(--color-junction) 88%, transparent);
}

/* De regel over de naad: geen van beide stijlen, dus Inter op een strook
   die over de lijn heen ligt, in de mengkleur omlijnd. */
.ts-seam {
  position: absolute;
  left: 50%;
  bottom: 1.1rem;
  transform: translateX(-50%);
  z-index: 2;
  width: max-content;
  max-width: 86%;
  text-align: center;
}
.ts-seam :deep(p),
.ts-seam :deep(div) {
  margin: 0;
}
.ts-seam :deep(p) {
  display: inline-block;
  padding: 0.4em 1.1em;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--step-1);
  color: var(--neutral-text);
  background: var(--deco-ground);
  border: 1px solid var(--color-junction);
}
</style>
