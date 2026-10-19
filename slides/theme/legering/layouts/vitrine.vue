<!--
  Een vitrine: drie of vier objecten naast elkaar, elk in een geklonken kast
  met een naamplaatje eronder — titel, herkomst, en waar nodig een
  waarschuwing in beeld.

  Bestaat omdat de les bij steampunk vooral moet tónen: leerlingen weten
  niet wat het is, en veel voorbeelden zeggen meer dan een definitie
  (beslissing eigenaar, #159). `triptych` zet beelden met een bijschrift in
  mono naast elkaar, maar de beelden hier hebben meer nodig dan een
  bijschrift: van de meeste is de herkomst onbekend, en één beeld is
  vermoedelijk AI-gegenereerd. Dat hoort op de slide, niet alleen in de
  notitie — de klas moet het zien. Het naamplaatje draagt daarom drie regels:
  `title`, `meta` (herkomst, ook als die "onbekend" is) en optioneel `badge`,
  een plaatje in perkament dat niet als ornament leest.

  Thema-eigen (legering). Gebouwd voor het register messing (de kast is
  geklonken en koper), maar de kleuren komen uit de tokens, dus hij draagt
  elk register.

  Gebruik:
    ---
    layout: vitrine
    class: messing
    reveal: true          # optioneel: één kast per klik
    items:
      - src: /cursus-esthetica/images/art-nouveau-en-deco/steampunk-bril.jpg
        title: Steampunkbril
        meta: massaproductie, webwinkel onbekend
      - src: /cursus-esthetica/images/art-nouveau-en-deco/steampunk-pegasus.jpg
        title: Mechanische pegasus
        meta: herkomst onbekend
        badge: vermoedelijk AI-gegenereerd
        crop: { left: 5 }   # optioneel, zie CropFigure
    ---

    ## Optionele kop

  Twee tot vier kasten op één rij. Het beeld past in zijn kast
  (CropFigure: `contain`, met optionele bijsnede); de lijst van het register
  (`--image-frame`) ligt strak om het getoonde beeld. Bij `reveal` dragen de
  kasten een `v-click`, dus Slidev telt de klikken zelf; twee takken in de
  template omdat `v-click` geen waarde kent die hem uitschakelt (zoals in
  triptych.vue). Beeldpaden door `resolveAsset` (in CropFigure).
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import CropFigure from '../parts/CropFigure.vue'
import type { Crop } from '../parts/CropFigure.vue'

interface Item {
  src: string
  title?: string
  meta?: string
  badge?: string
  crop?: Crop
}

const props = withDefaults(
  defineProps<{
    items?: Item[]
    reveal?: boolean
  }>(),
  { items: () => [], reveal: false },
)

const slots = useSlots()
const hasHeader = computed(() => !!slots.default)
const cases = computed(() =>
  props.items.map(item => ({
    src: item.src,
    title: item.title ?? '',
    meta: item.meta ?? '',
    badge: item.badge ?? '',
    crop: item.crop ?? {},
  })),
)
</script>

<template>
  <div class="slidev-layout vitrine" :class="{ 'vitrine--headed': hasHeader }">
    <header v-if="hasHeader" class="vitrine-header">
      <slot />
    </header>
    <div class="vitrine-row" :style="{ '--vitrine-count': cases.length }">
      <template v-if="reveal">
        <figure v-for="(item, i) in cases" :key="i" v-click class="vitrine-case">
          <div class="vitrine-stage">
            <CropFigure :src="item.src" :alt="item.title" :crop="item.crop" />
          </div>
          <figcaption class="vitrine-plate">
            <span v-if="item.badge" class="vitrine-badge">{{ item.badge }}</span>
            <span class="vitrine-title">{{ item.title }}</span>
            <span v-if="item.meta" class="vitrine-meta">{{ item.meta }}</span>
          </figcaption>
        </figure>
      </template>
      <template v-else>
        <figure v-for="(item, i) in cases" :key="i" class="vitrine-case">
          <div class="vitrine-stage">
            <CropFigure :src="item.src" :alt="item.title" :crop="item.crop" />
          </div>
          <figcaption class="vitrine-plate">
            <span v-if="item.badge" class="vitrine-badge">{{ item.badge }}</span>
            <span class="vitrine-title">{{ item.title }}</span>
            <span v-if="item.meta" class="vitrine-meta">{{ item.meta }}</span>
          </figcaption>
        </figure>
      </template>
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.vitrine {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: var(--space-md);
  padding: 2.2rem var(--space-lg) 2rem;
}
.slidev-layout.vitrine.vitrine--headed {
  grid-template-rows: auto minmax(0, 1fr);
}
.vitrine-header :deep(h2) {
  margin-bottom: 0;
}
.vitrine-row {
  display: grid;
  grid-template-columns: repeat(var(--vitrine-count, 3), minmax(0, 1fr));
  gap: var(--space-md);
  min-height: 0;
}

/* De kast: een donker vlak met een koperen rand, een tweede lijn binnenin,
   een klinknagel in elke hoek en een harde slagschaduw. */
.vitrine-case {
  display: grid;
  /* Het naamplaatje heeft een vaste hoogte (plaatje, titel, twee regels
     herkomst), zodat de titels van alle kasten op één lijn staan. */
  grid-template-rows: minmax(0, 1fr) 5.4rem;
  margin: 0;
  min-height: 0;
  min-width: 0;
  padding: 0.9rem 0.9rem 0;
  border: 2px solid var(--color-accent);
  box-shadow:
    inset 0 0 0 3px var(--color-bg),
    inset 0 0 0 4px color-mix(in srgb, var(--color-accent) 40%, transparent),
    6px 8px 0 color-mix(in srgb, black 50%, transparent);
  background:
    linear-gradient(170deg, color-mix(in srgb, white 5%, transparent), transparent 40%),
    var(--color-bg-elevated);
}
/* De klinknagels alleen in messing; in deco of nouveau is de kast een
   gewone vitrine met de lijn van het register. */
.slidev-layout.vitrine.messing .vitrine-case {
  background:
    radial-gradient(circle, var(--messing-brass-hi) 0 1px, var(--messing-brass) 1.8px 3px, var(--messing-brass-dark) 3.4px, transparent 4px)
      top 7px left 7px / 10px 10px no-repeat,
    radial-gradient(circle, var(--messing-brass-hi) 0 1px, var(--messing-brass) 1.8px 3px, var(--messing-brass-dark) 3.4px, transparent 4px)
      top 7px right 7px / 10px 10px no-repeat,
    linear-gradient(170deg, color-mix(in srgb, white 5%, transparent), transparent 40%),
    var(--color-bg-elevated);
}
.vitrine-stage {
  min-height: 0;
  min-width: 0;
  padding-bottom: 0.7rem;
}
.vitrine-stage :deep(.crop-window) {
  filter: var(--image-frame);
}

/* Het naamplaatje: op de volle breedte van de kast, onderaan. */
.vitrine-plate {
  /* titel bovenaan; het waarschuwingsplaatje hangt erboven (zie .vitrine-badge) */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
  gap: 0.15rem;
  margin: 0 -0.9rem;
  padding: 0.55rem 0.9rem 0.65rem;
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
  background: linear-gradient(to bottom, color-mix(in srgb, var(--color-accent) 12%, var(--color-bg)), var(--color-bg));
}
.vitrine-title {
  font-family: var(--font-display);
  font-style: var(--display-style);
  font-size: 1.05rem;
  line-height: 1.2;
  color: var(--color-heading);
}
.vitrine-meta {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-text-quiet);
}
.vitrine-badge {
  /* Op de rand van het plaatje, half over de kast: zo staat het in beeld
     zonder de titels uit de lijn te duwen. */
  position: absolute;
  left: 0.9rem;
  top: 0;
  transform: translateY(-60%);
  padding: 0.12em 0.55em;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1.4;
  color: var(--color-bg);
  background: var(--color-text);
}
</style>
