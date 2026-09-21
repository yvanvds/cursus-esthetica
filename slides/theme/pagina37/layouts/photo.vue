<!--
  Eén persfoto, groot, met het onderschrift eronder in mono — de krantenfoto.

  Bestaat omdat `image` een beeld zonder tekst is en de krant dat niet kent:
  een foto in de krant heeft altijd een onderschrift, op de breedte van het
  beeld, in de letter van de redactie. `triptych` en `detail` hebben wel
  bijschriften maar zetten meerdere beelden naast elkaar; hier is het er één,
  zo groot als de pagina toelaat.

  Thema-eigen (pagina37): het onderschrift in krantenstijl is de vorm van dit
  hoofdstuk. Een ander thema dat één beeld met bijschrift wil, gebruikt
  `detail` zonder crops of bouwt zijn eigen variant.

  Gebruik:
    ---
    layout: photo
    image: /cursus-esthetica/images/graffiti-en-street-art/header.jpg
    caption: Baksteen en rolluik — tags in verschillende handschriften
    credit: foto onbekend        # optioneel, rechts op de onderschriftregel
    ---

  Het beeld past met `object-fit: contain` in een podium; de werkelijk
  getoonde beeldrechthoek komt uit `useContainBox` (layouts-base) en het
  onderschrift krijgt precies die breedte en positie — links uitgelijnd met
  de linkerrand van het beeld, hoe het beeld ook past (#77, #92). Geen
  klikken, dus geen `useOwnClicks`. Beeldpad door `resolveAsset`.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { resolveAsset, useContainBox } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    image: string
    caption?: string
    credit?: string
  }>(),
  { caption: '', credit: '' },
)

const src = computed(() => resolveAsset(props.image))

const stage = ref<HTMLElement | null>(null)
const { onImageLoad, box } = useContainBox(stage)

/** Het onderschrift op de breedte van het beeld, uitgelijnd met zijn linkerrand. */
const captionStyle = computed<CSSProperties>(() => ({
  marginLeft: `${box.value.left}px`,
  width: `${box.value.width}px`,
}))
</script>

<template>
  <div class="slidev-layout photo">
    <figure class="photo-figure">
      <div ref="stage" class="photo-stage">
        <img class="photo-image" :src="src" :alt="caption" @load="onImageLoad" />
      </div>
      <figcaption v-if="caption || credit" class="photo-caption" :style="captionStyle">
        <span class="photo-caption-text">{{ caption }}</span>
        <span v-if="credit" class="photo-credit">{{ credit }}</span>
      </figcaption>
    </figure>
    <slot />
  </div>
</template>

<style scoped>
.slidev-layout.photo {
  padding: var(--space-lg) var(--space-lg) var(--space-md);
}

.photo-figure {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  height: 100%;
  margin: 0;
  min-height: 0;
}

.photo-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.photo-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

/* Het onderschrift: krantenlijn erboven, mono, links uitgelijnd met het
   beeld; de credit rechts, stiller. */
.photo-caption {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-md);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-rule);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.06em;
  line-height: 1.4;
  color: var(--color-text);
}
.photo-caption-text {
  flex: 1 1 auto;
}
.photo-credit {
  flex: 0 0 auto;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-quiet);
}
</style>
