<template>
  <div class="slidev-layout quadrants">
    <header class="quadrants-header">
      <slot />
    </header>
    <div class="quadrants-grid">
      <div class="quadrant" v-click><slot name="q1" /></div>
      <div class="quadrant" v-click><slot name="q2" /></div>
      <div class="quadrant" v-click><slot name="q3" /></div>
      <div class="quadrant" v-click><slot name="q4" /></div>
    </div>
  </div>
</template>
