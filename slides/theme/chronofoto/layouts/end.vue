<!--
  De slotslide ("Volgende keer") op de plaat.

  Overschrijft Slidevs ingebouwde `end`, omdat die in een scoped style
  `bg-black text-white` op zijn root zet, met een specificiteit die geen
  themaregel kan overrulen (#109). Dit thema is donker, dus onleesbaar wordt
  het niet, maar de grond verspringt dan van de plaat naar puur zwart en de
  koppen verliezen hun kleur. Deze layout rendert alleen de slot; de vorm
  komt uit `styles/layout.css` (`.slidev-layout.end`).

  Gebruik: `layout: end`, zoals in elk ander deck.
-->
<template>
  <div class="slidev-layout end">
    <slot />
  </div>
</template>
