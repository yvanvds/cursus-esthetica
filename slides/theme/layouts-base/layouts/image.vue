<script setup lang="ts">
import { computed } from 'vue'
import { handleBackground } from '../utils'

const props = defineProps({
  image: { type: String },
  backgroundSize: { type: String, default: 'cover' },
})

const style = computed(() => handleBackground(props.image, false, props.backgroundSize))
</script>

<template>
  <div class="slidev-layout image w-full h-full" :style="style">
    <slot />
  </div>
</template>
