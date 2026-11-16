<!--
  Eén heel breed beeld — een handrol, een fries, een panorama — dat per klik
  een halte opschuift. Het beeld staat op volle hoogte van het podium en is
  nooit in zijn geheel te zien; de klas leest het zoals het gelezen wordt.

  Bestaat omdat geen andere layout een beeld van 50:1 kan tonen: `image` met
  `contain` maakt er een streep van zes pixels hoog van, `cover` toont een
  willekeurig middenstuk, en `spotlight` laat het beeld per definitie staan.
  Een handrol wordt afgerold; dat gebaar is de layout.

  Gebruik:
    ---
    layout: rol
    image: /cursus-esthetica/images/beweging-en-dynamiek/huaisu-1.jpg
    stops: 6                 # aantal haltes, de eerste staat er meteen
    from: right              # leesrichting: `right` (standaard) begint rechts
                             # en schuift naar links, `left` omgekeerd
    caption: Huaisu, Autobiografie, 777
    ---

    ## Optionele titel

  Halte 1 staat er meteen; elke klik schuift naar de volgende, de laatste
  halte toont het andere uiteinde. De verschuiving is traag
  (`--rol-duration`, standaard 5s): het beeld rolt voorbij in plaats van te
  verspringen. Rechtsonder staat de halte (`3 / 6`).

  Het beeld wordt alleen met CSS geplaatst: het podium is een
  size-container, en de verschuiving is `(100cqw − 100%) × t`, waarin 100cqw
  de breedte van het podium is en 100% die van het beeld zelf. Geen
  metingen, dus niets dat uit de pas kan lopen als het beeld later laadt.

  De layout registreert zijn klikken zelf (`stops − 1`, via `useOwnClicks`,
  #93). Bij prefers-reduced-motion verspringt het beeld zonder te rollen.

  Tokens (allemaal optioneel): `--rol-duration`, `--rol-easing`,
  `--rol-height` (hoogte van het beeld, standaard het hele podium).
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset, useOwnClicks } from '../utils'

const props = withDefaults(
  defineProps<{
    image: string
    stops?: number
    from?: 'right' | 'left'
    caption?: string
  }>(),
  { stops: 5, from: 'right', caption: '' },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const { $clicks } = useSlideContext()

const count = computed(() => Math.max(Math.round(props.stops), 1))
useOwnClicks(() => count.value - 1)

const index = computed(() => Math.min(Math.max($clicks.value, 0), count.value - 1))

/** 0 = het linkeruiteinde in beeld, 1 = het rechteruiteinde. */
const position = computed(() => {
  const t = count.value > 1 ? index.value / (count.value - 1) : 0
  return props.from === 'right' ? 1 - t : t
})

const src = computed(() => resolveAsset(props.image))
</script>

<template>
  <div class="slidev-layout rol" :class="{ 'rol--headed': hasHeader }">
    <header v-if="hasHeader" class="rol-header">
      <slot />
    </header>
    <div class="rol-stage">
      <img class="rol-image" :src="src" :alt="caption" :style="{ '--rol-t': position }" />
    </div>
    <footer class="rol-foot">
      <span v-if="caption" class="rol-caption">{{ caption }}</span>
      <span v-if="count > 1" class="rol-stop">{{ index + 1 }} / {{ count }}</span>
    </footer>
  </div>
</template>
