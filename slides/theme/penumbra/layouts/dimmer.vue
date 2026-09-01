<!--
  Eén werk dat per klik zijn licht verliest, tot er niets meer staat.

  Bestaat omdat het hele hoofdstuk op één zin draait — "sluit de Dom 's avonds
  en Richter is er niet meer" — en geen enkele gedeelde layout dat gebaar kan
  maken. `image` toont één toestand; `compare` en `paired-reveal` zetten twee
  toestanden náást elkaar, en juist dat breekt het punt: het moet hetzelfde
  werk zijn dat ophoudt te bestaan, niet twee werken die je vergelijkt.
  Het hoofdstuk vraagt er zelf om — in licht-en-schaduw.mdx staat een
  COMPONENT-KANDIDAAT-notitie voor precies deze dimmer.

  Thema-eigen (penumbra): alleen een hoofdstuk over licht heeft hier iets aan.

  LET OP — dit is een simulatie, geen foto van het onverlichte werk. De slide
  zet dat er bewust niet bij; de docent kadert het mondeling. De
  sprekersnotitie van elke dimmer-slide hoort die zin te bevatten.

  Gebruik:
    ---
    layout: dimmer
    image: /cursus-esthetica/images/licht-en-schaduw/richter-2.jpg
    caption: Gerhard Richter, Domfenster, Köln, 2007
    steps:
      - vier uur 's middags
      - de zon zakt
      - de laatste bezoeker vertrekt
      - de stroom uit
    ---

  Stap 0 staat er meteen en is het volle licht; elke klik gaat één stap
  verder. Minder dan vijf stappen mag: de curve wordt over `steps` verdeeld.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    image: string
    caption?: string
    steps?: string[]
  }>(),
  { caption: '', steps: () => [] },
)

const { $clicks } = useSlideContext()

const src = computed(() => resolveAsset(props.image))

/** Aantal standen; minstens twee, anders valt er niets te dimmen. */
const stops = computed(() => Math.max(props.steps.length, 2))

const index = computed(() =>
  Math.min(Math.max($clicks.value, 0), stops.value - 1),
)

/**
 * Van vol licht (0) naar zwart (1), niet-lineair: de eerste stappen halen
 * weinig weg en de laatste bijna alles. Dat is hoe een zaal leegloopt — en
 * het is ook waar het punt zit, want de figuur valt pas op het eind uit
 * elkaar.
 */
const filter = computed(() => {
  const t = index.value / (stops.value - 1)
  const eased = t ** 1.6
  const brightness = 1 - 0.985 * eased;
  const contrast = 1 + 0.25 * eased;
  const saturate = 1 - 0.95 * eased;
  return `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturate.toFixed(3)})`
})

const label = computed(() => props.steps[index.value] ?? '')
</script>

<template>
  <div class="slidev-layout dimmer">
    <figure class="dimmer-frame">
      <img :src="src" :alt="caption" :style="{ filter }" />
      <figcaption v-if="caption" class="dimmer-caption">{{ caption }}</figcaption>
    </figure>
    <div v-if="label" class="dimmer-step">{{ label }}</div>
    <slot />
  </div>
</template>

<style scoped>
.slidev-layout.dimmer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: var(--color-bg-deep);
}

/* De grond is het diepste zwart van het thema, niet --color-bg: op het einde
   moet het beeld niet in een iets lichtere rechthoek achterblijven. */
.slidev-layout.dimmer::before { display: none; }

.dimmer-frame {
  position: relative;
  display: inline-block;
  line-height: 0;
  max-width: 100%;
  max-height: 100%;
  margin: 0;
}

.dimmer-frame > img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  transition: filter 1200ms ease-in-out;
}

.dimmer-caption {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-quiet);
  line-height: 1.4;
  background: linear-gradient(to top, rgba(5, 5, 5, 0.85), transparent);
}

.dimmer-step {
  position: absolute;
  right: var(--space-lg);
  bottom: var(--space-lg);
  z-index: 2;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-accent);
}
</style>
