<!--
  Eén beeld zo groot als de slide toelaat, in het kader van het register,
  met het bijschrift eronder op de breedte van het beeld.

  Bestaat omdat dit hoofdstuk veel losse figuren heeft (Gismonda, Guimard,
  het Volkshuis, Note G, Brüsel …) en de gedeelde layouts er geen goede vorm
  voor hebben: `image` toont het beeld zonder bijschrift en zonder kader,
  `detail` zonder uitsneden zet er een label "detail" boven. Hier draagt het
  beeld de lijst van zijn beweging — een groene boog, een getrapt gouden
  kader, een geklonken koperen rand — en die lijst ligt strak om het
  getoonde beeld, welke verhouding het ook heeft (CropFigure, zie
  ../parts/CropFigure.vue).

  Thema-eigen (legering).

  Gebruik:
    ---
    layout: plaat
    class: nouveau
    image: /cursus-esthetica/images/art-nouveau-en-deco/guimard-1.jpg
    caption: Hector Guimard, métro-ingang Porte Dauphine, Parijs, 1900
    crop: { top: 12, left: 4 }     # optioneel, procent van het beeld
    badge: vermoedelijk AI-gegenereerd   # optioneel, een plaatje in beeld
    ---

    ## Optionele kop

  Het kader volgt het register van de slide (de klasse uit de frontmatter);
  `frame: deco` overschrijft dat. Zonder register: geen kader. `crop` snijdt
  alleen de weergave bij, het bestand blijft zoals het is. Geen klikken.
-->
<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import CropFigure from '../parts/CropFigure.vue'
import type { Crop } from '../parts/CropFigure.vue'
import { registerOf } from '../parts/register'

const props = withDefaults(
  defineProps<{
    image: string
    caption?: string
    crop?: Crop
    badge?: string
    frame?: '' | 'nouveau' | 'deco' | 'messing'
  }>(),
  { caption: '', crop: () => ({}), badge: '', frame: undefined },
)

const attrs = useAttrs()
const slots = useSlots()
const hasHeader = computed(() => !!slots.default)

const frameKind = computed(() => props.frame ?? registerOf(attrs.class))

/* Ruimte onder het beeld voor het bijschrift: twee regels mono. */
const below = computed(() => (props.caption ? 46 : 0))
</script>

<template>
  <div class="slidev-layout plaat" :class="{ 'plaat--headed': hasHeader }">
    <header v-if="hasHeader" class="plaat-header">
      <slot />
    </header>
    <div class="plaat-stage">
      <CropFigure :src="image" :alt="caption" :crop="crop" :frame="frameKind" :below="below">
        <template v-if="caption || badge" #caption>
          <p v-if="badge" class="plaat-badge">{{ badge }}</p>
          <p v-if="caption" class="plaat-caption">{{ caption }}</p>
        </template>
      </CropFigure>
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.plaat {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl) var(--space-md);
}
.slidev-layout.plaat.plaat--headed {
  grid-template-rows: auto minmax(0, 1fr);
}
.plaat-header :deep(h2) {
  margin-bottom: 0;
}
.plaat-stage {
  min-height: 0;
  min-width: 0;
}
.slidev-layout.plaat .plaat-caption {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 400;
  line-height: 1.4;
  color: var(--color-text-quiet);
}
/* Een plaatje dat in beeld moet blijven, niet in de notitie: "vermoedelijk
   AI-gegenereerd". Perkament met donkere letter, zodat het niet als
   ornament leest. */
.slidev-layout.plaat .plaat-badge {
  display: inline-block;
  margin: 0 0 0.3rem;
  padding: 0.15em 0.6em;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1.4;
  color: var(--color-bg);
  background: var(--color-text);
}
</style>
