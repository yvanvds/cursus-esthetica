<!--
  De slotslide ("Volgende keer") op krantenpapier.

  Overschrijft Slidevs ingebouwde `end`, omdat die in een scoped style
  `bg-black text-white` op zijn root zet — met een specificiteit
  (`.slidev-layout.end[data-v-…]`) die geen themaregel op
  `.slidev-layout.end` kan overrulen. De andere thema's zijn donker en
  merken dat niet; op krantenpapier is het een zwart gat met onleesbare
  inkt. Deze layout rendert alleen de slot; de vorm komt uit
  `styles/layout.css` (`.slidev-layout.end`).

  Gebruik: `layout: end`, zoals in elk ander deck.
-->
<template>
  <div class="slidev-layout end">
    <slot />
  </div>
</template>
