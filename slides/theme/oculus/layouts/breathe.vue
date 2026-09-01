<!--
  Beeld over de volle slide, zonder chroom, op een achtergrond die traag van
  donker naar warmrood ademt — dezelfde curve als `skyspace-breathe` in
  `src/styles/themes/perspectief-en-ruimte.css`, zodat het deck en de
  hoofdstukpagina in beweging 4 hetzelfde doen.

  Bestaat voor de laatste beweging van hoofdstuk 02, waar het hoofdstuk beweert
  dat het werk een ruimte is waar je in staat. Een Skyspace als drie kleine
  rechthoekjes naast elkaar is precies het tegendeel; hier vult één opening het
  beeld en verschuift de kleur van de kamer eromheen. `image` geeft wel
  full-bleed maar geen adem, geen wisseling per klik en geen uitgesteld
  bijschrift.

  Gebruik:
    ---
    layout: breathe
    images:
      - /cursus-esthetica/images/perspectief/skyspace-1.png
      - /cursus-esthetica/images/perspectief/skyspace-2.png
    captions: ['Tremenheere', 'Rocky Mountains']   # optioneel
    ---

  Het eerste beeld staat er meteen; elke klik schuift naar het volgende.
  Respecteert `prefers-reduced-motion`: dan staat de achtergrond stil.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    images?: string[]
    captions?: string[]
  }>(),
  { images: () => [], captions: () => [] },
)

const { $clicks } = useSlideContext()

const resolved = computed(() => props.images.map(resolveAsset))

const index = computed(() => {
  const n = resolved.value.length
  if (n === 0) return -1
  return Math.min(Math.max($clicks.value, 0), n - 1)
})

const caption = computed(() => props.captions[index.value] ?? '')
</script>

<template>
  <div class="slidev-layout breathe">
    <div class="breathe-stage">
      <img
        v-for="(image, i) in resolved"
        :key="i"
        :src="image"
        :alt="captions[i] ?? ''"
        :class="{ 'is-visible': i === index }"
      />
    </div>
    <figcaption v-if="caption" class="breathe-caption">{{ caption }}</figcaption>
    <slot />
  </div>
</template>

<style scoped>
.slidev-layout.breathe {
  padding: 0;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}

@keyframes oculus-breathe {
  0%   { background-color: #131417; }
  33%  { background-color: #3d2b2b; }
  66%  { background-color: #471c1c; }
  100% { background-color: #6e2626; }
}

@media (prefers-reduced-motion: no-preference) {
  .slidev-layout.breathe {
    animation: oculus-breathe 75s ease-in-out alternate infinite;
  }
}

.breathe-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.breathe-stage img {
  position: absolute;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  opacity: 0;
  transition: opacity 900ms ease-in-out;
}

.breathe-stage img.is-visible {
  opacity: 1;
}

.breathe-caption {
  position: absolute;
  left: var(--space-lg);
  bottom: var(--space-lg);
  z-index: 2;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-text);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
}
</style>
