<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset } from '../utils'

const props = defineProps<{
  images?: string[]
}>()

const { $clicks } = useSlideContext()

const resolvedImages = computed(() => (props.images || []).map(resolveAsset))

const visibleIndex = computed(() => {
  const n = resolvedImages.value.length
  if (n === 0 || $clicks.value < 1) return -1
  return Math.min($clicks.value - 1, n - 1)
})
</script>

<template>
  <div class="slidev-layout paired-reveal">
    <div class="paired-reveal-text">
      <slot />
      <v-clicks>
        <slot name="steps" />
      </v-clicks>
      <slot name="after" />
    </div>
    <div class="paired-reveal-image">
      <img
        v-for="(src, i) in resolvedImages"
        :key="i"
        :src="src"
        v-show="i === visibleIndex"
      />
    </div>
  </div>
</template>
