<!--
  Twee beelden naast elkaar, `left:` en `right:`, elk passend in zijn helft.
  Geen slot: een kop of bijschrift op zo'n slide verdwijnt (zie SKILL.md §5).

  `magnify: true` (#170): klik 1 en 2 zetten links en rechts om de beurt zo
  groot als de slide toelaat, met de andere als strook aan de rand; klik 3
  keert terug naar het overzicht. Zie `useMagnify` in ../utils en
  ../parts/MagnifyLayer.vue. Beeldpaden door `resolveAsset`.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { resolveAsset, useMagnify } from '../utils'
import MagnifyLayer from '../parts/MagnifyLayer.vue'

const props = withDefaults(
  defineProps<{
    left: string
    right: string
    magnify?: boolean
  }>(),
  { magnify: false },
)

const leftUrl = computed(() => resolveAsset(props.left))
const rightUrl = computed(() => resolveAsset(props.right))

const magnifyItems = computed(() => [{ src: props.left }, { src: props.right }])
const { active, rootAttrs } = useMagnify(() => props.magnify, () => 2)
</script>

<template>
  <div class="slidev-layout compare" v-bind="rootAttrs">
    <div
      class="compare-image"
      :style="{ backgroundImage: `url(${leftUrl})` }"
      :data-magnify-source="magnify ? 0 : undefined"
    />
    <div
      class="compare-image"
      :style="{ backgroundImage: `url(${rightUrl})` }"
      :data-magnify-source="magnify ? 1 : undefined"
    />
    <MagnifyLayer v-if="magnify" :items="magnifyItems" :active="active" />
  </div>
</template>
