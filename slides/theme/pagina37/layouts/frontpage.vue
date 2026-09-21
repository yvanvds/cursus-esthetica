<!--
  De voorpagina — de cover van het deck als krantenpagina.

  Bestaat omdat de ingebouwde `cover` één vlak met een kop is, en dit deck
  zijn hele gedachte in de eerste slide moet kunnen zetten: de krant die
  van een gewoonte een beweging maakt, en de hand die er dwars doorheen
  schrijft. Masthead, dubbele lijn, datumregel, kop over de volle breedte,
  een persfoto met bijschrift — en per klik een tag over de kop heen.

  Thema-eigen (pagina37): alleen dit hoofdstuk heeft een krant als grond.

  Gebruik:
    ---
    layout: frontpage
    masthead: Cursus Esthetica
    edition: hoofdstuk 17
    dateline: New York, 21 juli 1971 — São Paulo, 2008 — Parijs, 2023
    page: pagina 37
    image: /cursus-esthetica/images/graffiti-en-street-art/header.jpg
    caption: Baksteen en rolluik — tags in verschillende handschriften
    tag: TAKI 183
    ---

    # Voor wie schrijf je je naam?

    ::standfirst::

    Een tag is geen versiering maar een bericht — alleen niet aan jou
    gericht.

  De kop komt uit de default slot, de intro uit `::standfirst::` (mag weg).
  Zonder `image` en zonder standfirst is de voorpagina alleen masthead,
  datumregel en kop — de kop krijgt dan de hele pagina (#114: de onderste
  helft gaf te veel van het antwoord weg). `tag` verschijnt bij de eerste
  klik, in spray óver de kop (geen multiply, zie het thema); zonder `tag`
  heeft de slide geen klik. Het beeld gaat door `resolveAsset` (layouts-
  base), zoals elke layout die een beeldpad verwerkt.

  De tag zit in de template met `v-click`, dus de klik is bij Slidev
  geregistreerd; `useOwnClicks` is hier niet nodig.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { resolveAsset } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    masthead?: string
    edition?: string
    dateline?: string
    page?: string
    image?: string
    caption?: string
    tag?: string
  }>(),
  {
    masthead: 'Cursus Esthetica',
    edition: '',
    dateline: '',
    page: '',
    image: '',
    caption: '',
    tag: '',
  },
)

const src = computed(() => (props.image ? resolveAsset(props.image) : ''))

const slots = useSlots()
const hasBody = computed(() => !!src.value || !!slots.standfirst)
</script>

<template>
  <div class="slidev-layout frontpage" :class="{ 'frontpage--headline-only': !hasBody }">
    <header class="fp-masthead">
      <span class="fp-paper">{{ masthead }}</span>
      <span v-if="edition" class="fp-edition">{{ edition }}</span>
    </header>
    <div class="rule fp-rule" />
    <div v-if="dateline || page" class="fp-dateline">
      <span>{{ dateline }}</span>
      <span v-if="page">{{ page }}</span>
    </div>

    <div class="fp-headline">
      <slot />
      <div v-if="tag" v-click class="fp-tag tag tag--spray" aria-hidden="true">{{ tag }}</div>
    </div>

    <div v-if="hasBody" class="fp-body" :class="{ 'fp-body--photo': !!src }">
      <div class="fp-standfirst">
        <slot name="standfirst" />
      </div>
      <figure v-if="src" class="fp-photo">
        <img :src="src" :alt="caption" />
        <figcaption v-if="caption">{{ caption }}</figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.frontpage {
  display: flex;
  flex-direction: column;
  padding: var(--space-md) var(--space-lg) var(--space-lg);
}

/* ── Masthead — de naam van de krant, en de editie rechts ────────── */
.fp-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
  padding-bottom: 0.15rem;
}
.fp-paper {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-3);
  letter-spacing: 0.02em;
  color: var(--color-text);
}
.fp-edition {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text);
}
.fp-rule { margin: 0 0 0.35rem; }

/* ── Datumregel ──────────────────────────────────────────────────── */
.fp-dateline {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-rule);
  padding-bottom: 0.3rem;
}

/* ── De kop over de volle breedte, met de tag erover ─────────────── */
.fp-headline {
  position: relative;
  padding: var(--space-md) 0 var(--space-sm);
}
/* Twee regels, gebroken na "schrijf" — een broadsheet-kop over twee
   regels laat geen weduwe van één woord staan. */
.fp-headline :deep(h1) {
  font-size: var(--step-6);
  line-height: 0.98;
  letter-spacing: -0.02em;
  max-width: 8.2em;
  margin: 0;
}

/* Zonder persfoto en standfirst neemt de kop de rest van de pagina: groter,
   verticaal gecentreerd in wat er onder de datumregel overblijft. */
.slidev-layout.frontpage.frontpage--headline-only .fp-headline {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: var(--space-xl);
}
.slidev-layout.frontpage.frontpage--headline-only .fp-headline :deep(h1) {
  font-size: 6.4rem;
  max-width: 8.2em;
}
.slidev-layout.frontpage.frontpage--headline-only .fp-tag {
  top: 28%;
  left: 4%;
  font-size: 8.4rem;
}

/* De tag over de kop: spuitbus, niet marker — zwarte marker over een zwarte
   kop is onleesbaar, en op muur-1.jpg gaat de rode SKY ook over de zwarte
   tags heen. De vorm (`.tag`, `.tag--spray`, `--tag-tilt`) komt uit het
   thema — inclusief de z-index die hem óver de kop legt; hier alleen plek
   en maat. */
/* Over de kop, niet over de datumregel: die moet leesbaar blijven. */
.slidev-layout.frontpage .fp-tag {
  position: absolute;
  left: 3%;
  top: 30%;
  font-size: 7.2rem;
  --tag-tilt: -6deg;
  transform-origin: 15% 80%;
  transition: opacity 180ms ease-out;
  z-index: 2;
}

/* ── De pagina eronder: kolom links, persfoto rechts ─────────────── */
.fp-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
  align-items: stretch;
  border-top: 1px solid var(--color-rule);
  padding-top: var(--space-sm);
}
.fp-body--photo {
  grid-template-columns: 1.1fr 1fr;
}
.fp-standfirst {
  min-width: 0;
}
.fp-standfirst :deep(p) {
  font-family: var(--font-serif);
  font-size: var(--step-2);
  line-height: 1.4;
  color: var(--color-text);
  margin: 0;
}
.fp-standfirst :deep(p + p) {
  font-size: var(--step-1);
  color: var(--color-text-muted);
  margin-top: var(--space-sm);
}

.fp-photo {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  min-width: 0;
  min-height: 0;
}
.fp-photo img {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  object-fit: cover;
  object-position: center;
  /* Persfoto's staan in zwart-wit en iets grof gerasterd op krantenpapier;
     de kleur gaat er grotendeels uit, het contrast iets omhoog. */
  filter: grayscale(0.85) contrast(1.08);
  border: 1px solid var(--color-rule);
}
.fp-photo figcaption {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.06em;
  line-height: 1.4;
  color: var(--color-text-dim);
}
</style>
