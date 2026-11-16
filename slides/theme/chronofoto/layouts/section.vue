<!--
  De sectieslide: `frame NN` boven de kop, de kop in het register van de
  beweging, en onderaan de route van het hoofdstuk met de plek waar de
  beweging nu zit.

  Overschrijft Slidevs ingebouwde `section` (die rendert alleen de slot),
  omdat de sectieslide hier het argument draagt: wat er op de slide beweegt
  verhuist mee met het hoofdstuk. De klasse van het register komt uit de
  frontmatter (`class: plakjes`); Slidev geeft die als attribuut door aan de
  root.

    belicht    de kop in meervoudige belichting, langs de diagonaal van
               Duchamps trap. Stilstaand.
    stil       niets. De kop staat gecentreerd op de hoogtelijnen.
    plakjes    de kop in vier opeenvolgende opnamen naast elkaar, gescheiden
               door beeldlijnen. Stilstaand.
    snelheid   de kop helt voorover, met snelheidsstrepen erachter.
               Stilstaand: de futuristen beloven snelheid, ze leveren haar
               niet.
    gebaar     onder de kop tekent zich één doorlopende lijn, in één haal.
               Beweegt één keer en blijft staan: een spoor.
    mobile     de kop hangt aan een draad en wiegt, zonder ophouden. Naast
               hem een mobile van drie schijven.
    motor      de kop staat stil tot er geklikt wordt; elke klik duwt hem
               een stap verder. `pushes: 4` in de frontmatter.

  Gebruik:
    ---
    layout: section
    class: plakjes
    frame: 3
    waar: tijd
    ---

    # 3 — Tijd in stukken

    Palo Alto, 19 juni 1878

  `frame` is het nummer boven de kop (zoals `frame 03` op de hoofdstukpagina).
  `waar` licht één halte op in de route onderaan; zonder `waar` staat de route
  er zonder aanduiding (beweging 1: de vraag is nog open).

  De animaties van `gebaar` en `mobile` lopen bij elke binnenkomst opnieuw:
  Slidev verbergt inactieve slides met `display: none`, en een CSS-animatie
  start opnieuw zodra het element weer getoond wordt. Bij
  prefers-reduced-motion staat alles stil en is de lijn er meteen.

  `motor` stapt zelf op `$clicks` en registreert zijn klikken met
  `useOwnClicks` (#93). Geen beeldpad, dus geen resolveAsset.

  Thema-eigen (chronofoto).
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { useOwnClicks } from '../../layouts-base/utils'

const props = withDefaults(
  defineProps<{
    frame?: string | number
    /** De halte waar de beweging nu zit. */
    waar?: string
    /** Alleen `motor`: het aantal klikken dat de kop verder duwt. */
    pushes?: number
  }>(),
  { frame: '', waar: '', pushes: 0 },
)

const STOPS = ['marmer', 'tijd', 'ideologie', 'gebaar', 'machine', 'jij']

const { $clicks } = useSlideContext()
useOwnClicks(() => Math.max(props.pushes, 0))

const push = computed(() => Math.min(Math.max($clicks.value, 0), Math.max(props.pushes, 0)))

const frameLabel = computed(() =>
  props.frame === '' ? '' : `frame ${String(props.frame).padStart(2, '0')}`,
)
</script>

<template>
  <div class="slidev-layout section" :style="{ '--push': push }">
    <!-- mobile: de draad waaraan de kop hangt, en de mobile ernaast -->
    <svg class="orn orn-mobile" viewBox="0 0 300 260" aria-hidden="true">
      <line x1="150" y1="0" x2="150" y2="50" />
      <g class="arm arm-1">
        <line x1="40" y1="50" x2="260" y2="50" />
        <line x1="40" y1="50" x2="40" y2="92" />
        <circle class="disc disc-red" cx="40" cy="116" r="24" />
        <line x1="260" y1="50" x2="260" y2="110" />
        <g class="arm arm-2">
          <line x1="205" y1="110" x2="295" y2="110" />
          <line x1="205" y1="110" x2="205" y2="150" />
          <circle class="disc" cx="205" cy="166" r="16" />
          <line x1="295" y1="110" x2="295" y2="190" />
          <circle class="disc" cx="295" cy="200" r="10" />
        </g>
      </g>
    </svg>

    <div class="section-body">
      <div v-if="frameLabel" class="section-frame">{{ frameLabel }}</div>
      <div class="section-head">
        <slot />
      </div>
      <!-- gebaar: één lijn, in één haal -->
      <svg class="orn orn-gebaar" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
        <path
          pathLength="1"
          d="M8,74 C90,6 150,118 250,62 S 372,2 470,70 S 610,128 700,52 S 800,10 860,66 S 940,104 992,40"
        />
      </svg>
    </div>

    <ol class="section-route" aria-label="Waar zit de beweging?">
      <li v-for="stop in STOPS" :key="stop" :class="{ here: stop === waar }">{{ stop }}</li>
    </ol>
  </div>
</template>

<style scoped>
.slidev-layout.section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: var(--space-2xl);
}

.section-body { position: relative; max-width: 46rem; }

.section-frame {
  font-family: var(--font-mono);
  font-size: var(--step-0);
  letter-spacing: 0.16em;
  color: var(--color-accent-text);
  margin-bottom: var(--space-sm);
}

.section-head :deep(h1) {
  font-size: clamp(3rem, 7.4vw, 6.2rem);
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin-bottom: 0;
  width: fit-content;
  max-width: 100%;
}
.section-head :deep(p) {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-quiet);
  margin-top: var(--space-md);
}

/* De route: zes haltes op een lijn, de huidige in rood. */
.section-route {
  position: absolute;
  left: var(--space-2xl);
  right: var(--space-xl);
  bottom: calc(var(--strip-height) + 3.6rem);
  display: flex;
  gap: var(--space-md);
  margin: 0;
  padding: 0;
  list-style: none;
}
.section-route li {
  flex: 1;
  padding: 0.5rem 0 0;
  margin: 0;
  border-top: 1px solid var(--color-border-subtle);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.16em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--color-text-quiet);
}
.section-route li.here {
  border-top: 2px solid var(--color-accent);
  padding-top: calc(0.5rem - 1px);
  color: var(--color-text);
}

.orn { display: none; position: absolute; pointer-events: none; overflow: visible; }

/* ── belicht ─────────────────────────────────────────────────────── */
.slidev-layout.section.belicht .section-head :deep(h1) {
  text-shadow: var(--exposure);
}

/* ── stil ────────────────────────────────────────────────────────── */
.slidev-layout.section.stil {
  align-items: center;
  text-align: center;
  padding-left: var(--space-xl);
}
.slidev-layout.section.stil .section-head :deep(h1) { margin-inline: auto; }

/* ── plakjes ─────────────────────────────────────────────────────────
   De kop is in opnamen gesneden: om de 1.25em een beeldlijn die de letters
   doorknipt (een masker, dus de grond komt erdoor). Geen schaduw: de
   sneden zijn het hele effect. */
.slidev-layout.section.plakjes .section-head :deep(h1) {
  --slice: 1.25em;
  --cut: 0.11em;
  -webkit-mask-image: repeating-linear-gradient(to right,
    #000 0 calc(var(--slice) - var(--cut)), transparent calc(var(--slice) - var(--cut)) var(--slice));
          mask-image: repeating-linear-gradient(to right,
    #000 0 calc(var(--slice) - var(--cut)), transparent calc(var(--slice) - var(--cut)) var(--slice));
}

/* ── snelheid ────────────────────────────────────────────────────── */
.slidev-layout.section.snelheid .section-head :deep(h1) {
  --streak-room: 1.7em;
  font-size: clamp(2.6rem, 5.6vw, 4.7rem);
  --streak: color-mix(in srgb, var(--color-accent) 55%, transparent);
  padding-left: var(--streak-room);
  padding-bottom: 0.12em;
  transform: skewX(-12deg);
  transform-origin: 0 100%;
  border-bottom: 1px solid var(--color-accent);
  background:
    linear-gradient(to right, transparent, var(--streak))
      0.1em 30% / calc(var(--streak-room) * 0.86) 0.05em no-repeat,
    linear-gradient(to right, transparent, var(--streak))
      0.7em 52% / calc(var(--streak-room) * 0.6) 0.05em no-repeat,
    linear-gradient(to right, transparent, var(--streak))
      0.35em 74% / calc(var(--streak-room) * 0.74) 0.05em no-repeat;
}
.slidev-layout.section.snelheid .section-frame,
.slidev-layout.section.snelheid .section-head :deep(p) {
  transform: skewX(-12deg);
  transform-origin: 0 100%;
}

/* ── gebaar ──────────────────────────────────────────────────────── */
.slidev-layout.section.gebaar .orn-gebaar {
  display: block;
  position: relative;
  width: min(100%, 40rem);
  height: 3.4rem;
  margin-top: var(--space-sm);
}
.orn-gebaar path {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  vector-effect: non-scaling-stroke;
  animation: chronofoto-haal 2.6s cubic-bezier(0.5, 0, 0.2, 1) 0.4s forwards;
}
@keyframes chronofoto-haal { to { stroke-dashoffset: 0; } }

.slidev-layout.section.gebaar .section-body { padding-bottom: 3.5rem; }

/* ── mobile ──────────────────────────────────────────────────────── */
.slidev-layout.section.mobile .orn-mobile {
  display: block;
  top: 0;
  right: 7%;
  width: 17rem;
  height: auto;
}
.orn-mobile line { stroke: var(--color-text-dim); stroke-width: 1.5; }
.orn-mobile .disc { fill: var(--color-text); }
.orn-mobile .disc-red { fill: var(--color-accent); }
.orn-mobile .arm { transform-box: view-box; }
.orn-mobile .arm-1 {
  transform-origin: 150px 50px;
  animation: chronofoto-wieg 9s ease-in-out infinite alternate;
}
.orn-mobile .arm-2 {
  transform-origin: 260px 110px;
  animation: chronofoto-wieg 6.2s ease-in-out -2s infinite alternate-reverse;
}
/* De kop hangt aan een draad van de bovenrand en wiegt om dat punt. */
.slidev-layout.section.mobile .section-body {
  transform-origin: 30% -60vh;
  animation: chronofoto-slinger 11s ease-in-out infinite alternate;
}
.slidev-layout.section.mobile .section-body {
  width: fit-content;
  max-width: 33rem;
  padding-top: var(--space-md);
  border-top: 1.5px solid var(--color-text-dim);
}
.slidev-layout.section.mobile .section-body::before {
  content: '';
  position: absolute;
  left: 30%;
  bottom: 100%;
  width: 1px;
  height: 100vh;
  background: var(--color-text-dim);
}
@keyframes chronofoto-wieg {
  from { transform: rotate(-7deg); }
  to   { transform: rotate(7deg); }
}
@keyframes chronofoto-slinger {
  from { transform: rotate(-0.9deg); }
  to   { transform: rotate(0.9deg); }
}

/* ── motor ───────────────────────────────────────────────────────── */
.slidev-layout.section.motor .section-head :deep(h1) {
  transform: translateX(calc(var(--push) * 1.6rem));
  transition: transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1);
  text-shadow:
    calc(var(--push) * -0.3rem) 0 0 color-mix(in srgb, var(--color-accent) 60%, transparent),
    calc(var(--push) * -0.6rem) 0 0 color-mix(in srgb, var(--color-accent) 30%, transparent),
    calc(var(--push) * -0.9rem) 0 0 color-mix(in srgb, var(--color-accent) 12%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .orn-gebaar path { animation: none; stroke-dashoffset: 0; }
  .orn-mobile .arm,
  .slidev-layout.section.mobile .section-body { animation: none; }
  .slidev-layout.section.motor .section-head :deep(h1) { transition: none; }
}
</style>
