<!--
  Twee fragmenten naast elkaar, elk met een eigen label, om ze in de les tegen
  elkaar aan te zetten.

  Bestaat omdat `compare` twee *beelden* doet en er voor twee *spelers* alleen
  het handgeschreven flex-patroon was: elke speler in een eigen `flex: 1`-wrapper
  (de `style`-prop moet dan leeg blijven, anders krijg je 60% van 50%) met het
  bijschrift met de hand als `<p class="meta-quiet">` eronder. Drie niveaus
  geneste HTML in een markdownbestand voor wat `compare` voor beelden in vier
  frontmatterregels doet — en zonder het label per kant dat de vergelijking pas
  leesbaar maakt (#39, #61).

  Gebruik:
    ---
    layout: duet
    left:  { id: meerstemmigheid/leonin,  label: "Léonin · ca. 1170 · twee stemmen" }
    right: { id: meerstemmigheid/perotin, label: "Pérotin · ca. 1200 · vier stemmen" }
    ---

    ## Optionele kop — de vraag die de docent stelt

  Anders dan `compare` heeft deze layout wél een slot: op een vergelijkingsslide
  hoort de vraag boven de twee kanten te kunnen staan.

  `id` is `<theme-id>/<video-key>`, net als bij CourseVideo(Inline); een key die
  niet bestaat rendert zichtbaar rood in plaats van als lege plek. `label` is
  optioneel — laat je hem weg, dan blijft de regel onder die kant leeg.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import CourseVideoInline from '../components/CourseVideoInline.vue'

interface Side {
  id: string
  label?: string
}

const props = defineProps<{
  left: Side
  right: Side
}>()

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

// Een ontbrekende kant valt terug op een lege id: CourseVideoInline rendert dan
// zichtbaar rood `Onbekend fragment:` in plaats van een lege kolom. Een typo in
// de frontmatter (`rigth:`) mag geen stille halve slide opleveren.
const sides = computed(() => [props.left, props.right].map(side => side ?? { id: '' }))
</script>

<template>
  <div class="slidev-layout duet" :class="{ 'duet--headed': hasHeader }">
    <header v-if="hasHeader" class="duet-header">
      <slot />
    </header>
    <div class="duet-row">
      <figure v-for="(side, i) in sides" :key="i" class="duet-panel">
        <CourseVideoInline :id="side.id" />
        <figcaption v-if="side.label" class="duet-label">{{ side.label }}</figcaption>
      </figure>
    </div>
  </div>
</template>
