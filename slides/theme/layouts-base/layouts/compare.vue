<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  left: string
  right: string
}>()

function resolveAsset(path: string): string {
  if (!path) return path
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  if (path.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/'
    return base.replace(/\/$/, '') + path
  }
  return path
}

const leftUrl = computed(() => resolveAsset(props.left))
const rightUrl = computed(() => resolveAsset(props.right))
</script>

<template>
  <div class="slidev-layout compare">
    <div class="compare-image" :style="{ backgroundImage: `url(${leftUrl})` }" />
    <div class="compare-image" :style="{ backgroundImage: `url(${rightUrl})` }" />
  </div>
</template>
