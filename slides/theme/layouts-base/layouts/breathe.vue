<!--
  Beeld over de volle slide, zonder chroom, op een achtergrond die traag van
  de ene naar de andere kleur ademt. Het eerste beeld staat er meteen; elke
  klik schuift naar het volgende.

  Bestaat voor een werk dat een ruimte ís in plaats van een object in een
  ruimte. `image` geeft wel full-bleed maar geen adem, geen wisseling per klik
  en geen uitgesteld bijschrift; `triptych` zou zo'n werk tot drie kleine
  rechthoekjes terugbrengen — precies het tegendeel van wat het beweert.

  Stond eerst thema-eigen in `oculus` (hoofdstuk 02, de Skyspaces van Turrell).
  Verhuisd naar layouts-base toen hoofdstuk 03 hem ook nodig bleek te hebben
  voor Eliassons Weather Project. De twee kleuren van de ademhaling zijn
  daarom tokens geworden in plaats van hardgecodeerde hex:

    --breathe-from   beginkleur van de kamer   (fallback: --color-bg)
    --breathe-to     eindkleur van de kamer    (fallback: --color-bg)

  Zet ze in het thema, niet hier. Zet je ze niet, dan staat de achtergrond
  stil op --color-bg en gedraagt de layout zich als een nette full-bleed.

  Gebruik:
    ---
    layout: breathe
    images:
      - /cursus-esthetica/images/perspectief/skyspace-1.png
      - /cursus-esthetica/images/perspectief/skyspace-2.png
    captions: ['Tremenheere', 'Rocky Mountains']   # optioneel
    ---

  Respecteert `prefers-reduced-motion`: dan staat de achtergrond stil.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { resolveAsset } from '../utils'

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
