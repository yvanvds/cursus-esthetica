<!--
  De slotslide ("Volgende keer"), in het register van de slide.

  Overschrijft Slidevs ingebouwde `end`, omdat die in een scoped style
  `bg-black text-white` op zijn root zet — met een specificiteit
  (`.slidev-layout.end[data-v-…]`) die geen themaregel kan overrulen. Dan
  zou het register van de slotslide (`class: deco`) zijn grond en zijn
  kopkleur verliezen. Deze layout rendert alleen de slot; de vorm komt uit
  `styles/layout.css` (`.slidev-layout.end`). Zelfde reden en vorm als
  `pagina37/layouts/end.vue` (#109).

  Gebruik: `layout: end`, met `class: deco` (of een ander register).

  Thema-eigen (legering).
-->
<template>
  <div class="slidev-layout end">
    <slot />
  </div>
</template>
