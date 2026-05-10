<script setup lang="ts">
defineProps<{
  left: string
  right: string
}>()
</script>

<template>
  <div class="slidev-layout compare">
    <div class="compare-image" :style="{ backgroundImage: `url(${left})` }" />
    <div class="compare-image" :style="{ backgroundImage: `url(${right})` }" />
  </div>
</template>
