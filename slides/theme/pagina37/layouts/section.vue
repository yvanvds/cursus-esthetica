<!--
  De sectieslide — het nummer van de beweging groot in spuitbusrood, als
  tag-laag over de pagina; de bewegingstitel als krantenkop; de ondertitel
  als datumregel in mono-kapitaal.

  Overschrijft Slidevs ingebouwde `section` (die rendert alleen de slot),
  omdat het nummer hier niet in de kop hoort maar erop: de krant drukt
  "Een koerier op pagina 37", en iemand heeft er een 1 over gespoten.

  AFWIJKING VAN DE SKILL-CONVENTIE `# N — <beweging>` (slidev/SKILL.md §2):
  in dit deck staat het nummer alleen als gespoten laag en niet in de kop.
  Zo besliste de eigenaar bij het checkpoint van #109 — print plus laag,
  zonder dubbel cijfer. De bewegingsvolgorde blijft leesbaar op de slide
  (het cijfer staat er groot), en `npm run check:slides` leest de koppen
  niet. Volgend deck met een ander thema: gewoon weer `# N — <beweging>`.

  Thema-eigen (pagina37): de spray hoort bij dit hoofdstuk.

  Gebruik:
    ---
    layout: section
    number: 1
    ---

    # Een koerier op pagina 37

    Een naam, honderden keren, hetzelfde handschrift

  `number` mag weg; dan is het een gewone sectieslide zonder tag-laag.
  Geen klikken, geen beeldpad — dus geen useOwnClicks en geen resolveAsset.
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    number?: string | number
  }>(),
  { number: '' },
)
</script>

<template>
  <div class="slidev-layout section">
    <div v-if="number !== ''" class="section-tag" aria-hidden="true">{{ number }}</div>
    <div class="section-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.section {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-xl) var(--space-2xl) var(--space-2xl) var(--space-xl);
}

/* De spray: één cijfer, groter dan de pagina hoog is, rechts, met de
   halo van een spuitbus. Multiply zodat de kop erdoorheen leesbaar blijft
   — inkt over inkt wordt donkerder, niet onleesbaar. */
.section-tag {
  position: absolute;
  z-index: 0;
  right: 2.5rem;
  top: 1rem;
  font-family: var(--font-hand);
  font-size: 19rem;
  line-height: 1;
  color: var(--color-accent);
  mix-blend-mode: multiply;
  opacity: 0.92;
  transform: rotate(-6deg);
  transform-origin: 50% 60%;
  text-shadow:
    0 0 0.012em var(--color-accent-halo),
    0 0 0.04em var(--color-accent-line),
    0 0 0.12em var(--color-accent-soft);
  pointer-events: none;
  user-select: none;
}

/* De kop en de datumregel staan op de pagina, onder de spray in de
   stapel maar zwart genoeg om erdoorheen te lezen. */
.section-body {
  position: relative;
  z-index: 1;
  max-width: 72%;
}
.section-body :deep(h1) {
  font-size: var(--step-6);
  max-width: 9em;
  margin-bottom: var(--space-sm);
}
.section-body :deep(p) {
  border-top: 1px solid var(--color-rule);
  padding-top: 0.5rem;
  display: inline-block;
}
</style>
