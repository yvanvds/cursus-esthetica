<!--
  Een reeks beelden als schaal: op één rij, elk op een vaste plek, met een as
  eronder die zegt waarlangs de reeks loopt (seconden → uren, één kleur →
  volgebouwd). Eén beeld per klik; de lege plekken staan er vanaf het begin.

  Bestaat omdat `triptych reveal` de beelden wel één voor één toont maar niets
  zegt over hun onderlinge verhouding — vier werken naast elkaar zijn vier
  werken. Hier is de rij een gradatie: de plek van elk beeld op de as ís het
  argument. Voor graffiti (tag → throw-up → piece → wildstyle), maar even goed
  voor een schets → studie → doek, of vroeg → laat in een oeuvre.

  Gebruik:
    ---
    layout: scale
    images:
      - /cursus-esthetica/images/graffiti-en-street-art/tag-3.jpg
      - /cursus-esthetica/images/graffiti-en-street-art/throwup-1.jpg
      - /cursus-esthetica/images/graffiti-en-street-art/piece-1.jpg
      - /cursus-esthetica/images/graffiti-en-street-art/wildstyle-1.jpg
    labels: [tag, throw-up, piece, wildstyle]           # optioneel, boven elk beeld
    captions: [één kleur, twee kleuren, uren, splinters] # optioneel, eronder
    axis:  { from: seconden, to: uren }                  # optioneel
    axis2: { from: één kleur, to: volgebouwd }           # optioneel, tweede as
    reveal: true                                         # standaard: één per klik
    stage: true                                          # het laatst onthulde beeld groot erboven
    ---

    ## Optionele titel

  `stage` bestaat omdat vier beelden op één rij op het canvas van 980 px elk
  maar ~210 px breed zijn: een tag is dan herkenbaar, de splinters van een
  wildstyle niet. Met `stage: true` blijft de rij de schaal en staat het
  laatst onthulde beeld groot erboven; de rij wijst met een accentlijn aan
  welk beeld dat is. Zonder `reveal` toont het podium het eerste beeld.

  Werkt met twee tot vijf beelden. `labels` en `captions` mogen korter zijn
  dan `images`.

  Klikken: elk paneel heeft `v-click`, dus de klikken staan bij Slidev
  geregistreerd en `useOwnClicks` is niet nodig. Het podium leest `$clicks`
  alleen mee om te weten welk beeld het laatst onthuld is. Net als in
  triptych staan de twee takken (met en zonder `v-click`) apart: `v-click`
  kent geen waarde die hem uitschakelt.

  Beeldpaden gaan door `resolveAsset` (zie utils.ts) — anders prefixt Slidev
  de deck-base vóór een pad dat al absoluut is t.o.v. de site.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset } from '../utils'

interface Axis {
  from?: string
  to?: string
}

const props = withDefaults(
  defineProps<{
    images?: string[]
    labels?: string[]
    captions?: string[]
    axis?: Axis
    axis2?: Axis
    reveal?: boolean
    stage?: boolean
  }>(),
  {
    images: () => [],
    labels: () => [],
    captions: () => [],
    axis: undefined,
    axis2: undefined,
    reveal: true,
    stage: false,
  },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const { $clicks } = useSlideContext()

const panels = computed(() =>
  props.images.map((src, i) => ({
    src: resolveAsset(src),
    label: props.labels[i] ?? '',
    caption: props.captions[i] ?? '',
  })),
)

/** Index van het beeld dat het podium toont; -1 zolang er niets onthuld is. */
const current = computed(() => {
  const n = panels.value.length
  if (n === 0) return -1
  if (!props.reveal) return 0
  return Math.min(Math.max($clicks.value, 0), n) - 1
})

const axes = computed(() => [props.axis, props.axis2].filter((a): a is Axis => !!a))
</script>

<template>
  <div
    class="slidev-layout scale"
    :class="{ 'scale--headed': hasHeader, 'scale--staged': stage }"
  >
    <header v-if="hasHeader" class="scale-header">
      <slot />
    </header>

    <figure v-if="stage" class="scale-stage">
      <img
        v-for="(panel, i) in panels"
        :key="i"
        :src="panel.src"
        :alt="panel.label || panel.caption"
        :class="{ 'is-visible': i === current }"
      />
    </figure>

    <div class="scale-row" :style="{ '--scale-count': panels.length }">
      <template v-if="reveal">
        <figure
          v-for="(panel, i) in panels"
          :key="i"
          class="scale-panel"
          :class="{ 'is-current': stage && i === current }"
          v-click
        >
          <div v-if="panel.label" class="scale-label">{{ panel.label }}</div>
          <img :src="panel.src" :alt="panel.label || panel.caption" />
          <figcaption v-if="panel.caption">{{ panel.caption }}</figcaption>
        </figure>
      </template>
      <template v-else>
        <figure
          v-for="(panel, i) in panels"
          :key="i"
          class="scale-panel"
          :class="{ 'is-current': stage && i === current }"
        >
          <div v-if="panel.label" class="scale-label">{{ panel.label }}</div>
          <img :src="panel.src" :alt="panel.label || panel.caption" />
          <figcaption v-if="panel.caption">{{ panel.caption }}</figcaption>
        </figure>
      </template>
    </div>

    <div v-for="(a, i) in axes" :key="i" class="scale-axis">
      <span class="scale-axis-pole">{{ a.from }}</span>
      <span class="scale-axis-line" />
      <span class="scale-axis-pole">{{ a.to }}</span>
    </div>
  </div>
</template>
