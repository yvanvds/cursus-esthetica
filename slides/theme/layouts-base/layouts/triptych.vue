<!--
  Drie beelden naast elkaar, elk volledig in beeld, met een optioneel
  bijschrift per beeld.

  Bestaat omdat `compare` er precies twee doet, `quadrants` een tekstgrid is en
  `paired-reveal` er één tegelijk toont. Figuurgroepen van drie zijn de plek
  waar de dekking in de bestaande decks lekte: wie een groep van drie over twee
  slides moet splitsen, laat er in de praktijk één vallen (zie SKILL.md §3).

  Gebruik:
    ---
    layout: triptych
    images:
      - /cursus-esthetica/images/perspectief/klint-1.png
      - /cursus-esthetica/images/perspectief/klint-2.png
      - /cursus-esthetica/images/perspectief/klint-3.png
    captions: [installatiezicht, 'nr 7', 'nr 1']   # optioneel
    reveal: true                                   # optioneel: één per klik
    magnify: true                                  # optioneel: per klik één groot
    ---

    ## Optionele titel

  Werkt met twee, drie of vier beelden — de rij verdeelt de breedte gelijk.
  `captions` mag korter zijn dan `images`; ontbrekende bijschriften blijven leeg.

  `magnify: true` (#170): klik 1 … n zet beeld k zo groot als de slide toelaat,
  zonder bijschrift, met de andere als strook aan de rand; klik n + 1 keert
  terug naar het overzicht. Zie `useMagnify` in ../utils en
  ../parts/MagnifyLayer.vue. `magnify` vervangt `reveal`: staan ze allebei aan,
  dan staat het overzicht er meteen volledig.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { resolveAsset, useMagnify } from '../utils'
import MagnifyLayer from '../parts/MagnifyLayer.vue'

const props = withDefaults(
  defineProps<{
    images?: string[]
    captions?: string[]
    reveal?: boolean
    magnify?: boolean
  }>(),
  { images: () => [], captions: () => [], reveal: false, magnify: false },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const panels = computed(() =>
  props.images.map((src, i) => ({
    src: resolveAsset(src),
    caption: props.captions[i] ?? '',
  })),
)

const magnifyItems = computed(() => props.images.map((src, i) => ({ src, alt: props.captions[i] ?? '' })))
const { active, rootAttrs } = useMagnify(() => props.magnify, () => props.images.length)
</script>

<template>
  <div class="slidev-layout triptych" :class="{ 'triptych--headed': hasHeader }" v-bind="rootAttrs">
    <header v-if="hasHeader" class="triptych-header">
      <slot />
    </header>
    <!-- Twee takken in plaats van een dynamische directive: `v-click` kent geen
         waarde die hem uitschakelt, dus een `reveal ? … : false` zou stil elke
         paneel-klik aanzetten. -->
    <div class="triptych-row" :style="{ '--triptych-count': panels.length }">
      <template v-if="reveal && !magnify">
        <figure v-for="(panel, i) in panels" :key="i" class="triptych-panel" v-click>
          <img :src="panel.src" :alt="panel.caption" />
          <figcaption v-if="panel.caption">{{ panel.caption }}</figcaption>
        </figure>
      </template>
      <template v-else>
        <figure v-for="(panel, i) in panels" :key="i" class="triptych-panel">
          <img :src="panel.src" :alt="panel.caption" :data-magnify-source="magnify ? i : undefined" />
          <figcaption v-if="panel.caption">{{ panel.caption }}</figcaption>
        </figure>
      </template>
    </div>
    <MagnifyLayer v-if="magnify" :items="magnifyItems" :active="active" />
  </div>
</template>
