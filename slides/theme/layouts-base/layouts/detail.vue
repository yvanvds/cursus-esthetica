<!--
  Eén werk groot, met één of twee uitsneden ernaast die als uitsnede herkenbaar
  zijn: kleiner, in een eigen kolom, elk met het woord "detail" erboven.

  Bestaat omdat `triptych` drie gelijke panelen op een rij zet en daarmee beweert
  dat het drie werken zijn. Voor een groep als `belshazzar` in hoofdstuk 03 is
  dat feitelijk onjuist: dat is één schilderij plus twee uitvergrotingen ervan.
  Heel-plus-detail-groepen komen door de hele collectie voor, vandaar
  layouts-base en niet een thema.

  Gebruik:
    ---
    layout: detail
    image: /cursus-esthetica/images/licht-en-schaduw/rembrandt-2.png
    caption: Rembrandt, Het feestmaal van Belshazzar, 1636
    details:
      - src: /cursus-esthetica/images/licht-en-schaduw/rembrandt-3.png
        caption: de omgekeerde beker, de gemorste wijn
      - src: /cursus-esthetica/images/licht-en-schaduw/rembrandt-4.png
        caption: gouddraad dat het licht vangt
    reveal: true      # optioneel: de details één per klik
    ---

    ## Optionele titel

  Het hele werk staat er altijd meteen; alleen de details wachten op een klik.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { resolveAsset } from '../utils'

interface Detail {
  src: string
  caption?: string
}

const props = withDefaults(
  defineProps<{
    image: string
    caption?: string
    details?: Detail[]
    reveal?: boolean
    label?: string
  }>(),
  { caption: '', details: () => [], reveal: false, label: 'detail' },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const whole = computed(() => resolveAsset(props.image))
const crops = computed(() =>
  props.details.map(detail => ({
    src: resolveAsset(detail.src),
    caption: detail.caption ?? '',
  })),
)
</script>

<template>
  <div class="slidev-layout detail" :class="{ 'detail--headed': hasHeader }">
    <header v-if="hasHeader" class="detail-header">
      <slot />
    </header>
    <div class="detail-row">
      <figure class="detail-whole">
        <img :src="whole" :alt="caption" />
        <figcaption v-if="caption">{{ caption }}</figcaption>
      </figure>
      <!-- Twee takken in plaats van een dynamische directive: `v-click` kent
           geen waarde die hem uitschakelt, dus `reveal ? … : false` zou stil
           elke uitsnede-klik aanzetten. Zelfde reden als in triptych.vue. -->
      <div class="detail-crops">
        <template v-if="reveal">
          <figure v-for="(crop, i) in crops" :key="i" class="detail-crop" v-click>
            <span class="detail-crop-label">{{ label }}</span>
            <img :src="crop.src" :alt="crop.caption" />
            <figcaption v-if="crop.caption">{{ crop.caption }}</figcaption>
          </figure>
        </template>
        <template v-else>
          <figure v-for="(crop, i) in crops" :key="i" class="detail-crop">
            <span class="detail-crop-label">{{ label }}</span>
            <img :src="crop.src" :alt="crop.caption" />
            <figcaption v-if="crop.caption">{{ crop.caption }}</figcaption>
          </figure>
        </template>
      </div>
    </div>
  </div>
</template>
