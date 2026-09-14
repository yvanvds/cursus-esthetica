<!--
  Eén werk met één of twee uitsneden die als uitsnede herkenbaar zijn: elk met
  het woord "detail" erboven en zijn bijschrift eronder.

  Bestaat omdat `triptych` gelijke panelen op een rij zet en daarmee beweert
  dat het aparte werken zijn. Voor een groep als `belshazzar` in hoofdstuk 03
  is dat feitelijk onjuist: dat is één schilderij plus twee uitvergrotingen
  ervan. Heel-plus-detail-groepen komen door de hele collectie voor, vandaar
  layouts-base en niet een thema.

  Twee vormen, gekozen door `image:`:

  - Mét `image:` — het geheel groot links, de uitsneden in een smalle kolom
    rechts. De hiërarchie ís het argument: dit is één werk, dat zijn stukken
    ervan.
  - Zónder `image:` — alleen de uitsneden, als een rij over de volle breedte.
    Kies dit wanneer het geheel al op de slide ervóór stond (of erna
    terugkomt): het label "detail" zegt dan nog altijd dat dit geen twee
    werken zijn maar twee stukken van één, zonder dat het geheel de helft van
    de slide inneemt (#94).

  Gebruik:
    ---
    layout: detail
    image: /cursus-esthetica/images/licht-en-schaduw/rembrandt-2.png   # optioneel
    caption: Rembrandt, Het feestmaal van Belshazzar, 1636              # alleen bij image
    details:
      - src: /cursus-esthetica/images/licht-en-schaduw/rembrandt-3.png
        caption: de omgekeerde beker, de gemorste wijn
      - src: /cursus-esthetica/images/licht-en-schaduw/rembrandt-4.png
        caption: gouddraad dat het licht vangt
    reveal: true      # optioneel: de details één per klik
    ---

    ## Optionele titel

  Het hele werk staat er altijd meteen; alleen de details wachten op een klik.
  De rij-vorm zet zijn kolomaantal als `--detail-count` op `.detail-crops`,
  zoals `triptych` dat met `--triptych-count` doet.
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
    image?: string
    caption?: string
    details?: Detail[]
    reveal?: boolean
    label?: string
  }>(),
  { image: '', caption: '', details: () => [], reveal: false, label: 'detail' },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)
const hasWhole = computed(() => !!props.image)

const whole = computed(() => resolveAsset(props.image))
const crops = computed(() =>
  props.details.map(detail => ({
    src: resolveAsset(detail.src),
    caption: detail.caption ?? '',
  })),
)
</script>

<template>
  <div
    class="slidev-layout detail"
    :class="{ 'detail--headed': hasHeader, 'detail--row': !hasWhole }"
  >
    <header v-if="hasHeader" class="detail-header">
      <slot />
    </header>
    <div class="detail-row">
      <figure v-if="hasWhole" class="detail-whole">
        <img :src="whole" :alt="caption" />
        <figcaption v-if="caption">{{ caption }}</figcaption>
      </figure>
      <!-- Twee takken in plaats van een dynamische directive: `v-click` kent
           geen waarde die hem uitschakelt, dus `reveal ? … : false` zou stil
           elke uitsnede-klik aanzetten. Zelfde reden als in triptych.vue. -->
      <div class="detail-crops" :style="{ '--detail-count': crops.length }">
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
