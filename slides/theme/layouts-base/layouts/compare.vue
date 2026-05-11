<script setup lang="ts">
import { computed } from 'vue'
import { resolveAsset } from '../utils'

const props = defineProps<{
  left: string
  right: string
}>()

const leftUrl = computed(() => resolveAsset(props.left))
const rightUrl = computed(() => resolveAsset(props.right))
</script>

<template>
  <div class="slidev-layout compare">
    <div class="compare-image" :style="{ backgroundImage: `url(${leftUrl})` }" />
    <div class="compare-image" :style="{ backgroundImage: `url(${rightUrl})` }" />
  </div>
</template>
