<!--
  De sectieslide, met het ornament van het register erin.

  Overschrijft Slidevs ingebouwde `section` (die rendert alleen de slot),
  omdat elke beweging hier haar stijl aankondigt vóór er één beeld staat:

    nouveau  de zweepslag van Obrist tekent zich van links naar rechts door
             de slide, de kop staat er asymmetrisch onder, links
    deco     de zonnestraal waaiert open onder een gecentreerde kop in
             kapitaal — symmetrie, de kroon van het Chrysler Building
    messing  een manometer met een wijzer die uitslaat naar het nummer van
             de beweging, de kop op een geklonken plaat

  Alle drie de ornamenten staan in de template; de klasse van het register
  op de root (`class: nouveau | deco | messing`, een gewone frontmatter-
  klasse die Slidev als attribuut doorgeeft) bepaalt welke er zichtbaar is.
  Zonder register: geen ornament, een kale sectieslide.

  Gebruik:
    ---
    layout: section
    class: messing
    number: 6          # alleen de wijzer van messing leest het
    ---

    # 6 — De toekomst van gisteren

    Steampunk, Babbage, Metropolis

  De wijzerplaat telt standaard acht bewegingen, zoveel als het hoofdstuk
  sinds #171 heeft; `of: N` in de frontmatter overschrijft dat.

  De animaties lopen bij elke binnenkomst opnieuw: Slidev verbergt
  inactieve slides met `display: none`, en een CSS-animatie start opnieuw
  zodra het element weer getoond wordt. Geen klikken, geen beeldpad — dus
  geen useOwnClicks en geen resolveAsset.

  Thema-eigen (legering).
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    number?: string | number
    /** Het aantal bewegingen op de wijzerplaat. */
    of?: number
  }>(),
  { number: '', of: 8 },
)

/* De zonnestraal: zeventien stralen om de tien graden, van −80° tot 80°,
   om de andere korter. De twee horizontale stralen (±90°) vallen weg: die
   zouden over de onderrand van de lijst liggen. */
const rays = Array.from({ length: 17 }, (_, i) => ({
  angle: -80 + i * 10,
  length: i % 2 === 0 ? 94 : 64,
}))

/* De wijzerplaat: de cijfers 1..of over 240 graden, van linksonder naar
   rechtsonder, zoals een manometer. */
const SWEEP = 240
const dial = computed(() =>
  Array.from({ length: props.of }, (_, i) => {
    const angle = -SWEEP / 2 + (SWEEP * i) / Math.max(props.of - 1, 1)
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      n: i + 1,
      angle,
      x: 100 + 52 * Math.cos(rad),
      y: 100 + 52 * Math.sin(rad),
    }
  }),
)
/* Fijne streepjes tussen de cijfers: vier per interval. */
const ticks = computed(() => {
  const steps = (props.of - 1) * 5
  return Array.from({ length: steps + 1 }, (_, i) => ({
    angle: -SWEEP / 2 + (SWEEP * i) / steps,
    major: i % 5 === 0,
  }))
})
const needle = computed(() => {
  const n = Number(props.number)
  if (!Number.isFinite(n) || n < 1) return -SWEEP / 2
  return -SWEEP / 2 + (SWEEP * (Math.min(n, props.of) - 1)) / Math.max(props.of - 1, 1)
})
</script>

<template>
  <div class="slidev-layout section">
    <!-- nouveau: de zweepslag, één gevuld pad (dat van de site), dat zich
         van links naar rechts onthult -->
    <svg class="orn orn-whiplash" viewBox="0 0 252 40" aria-hidden="true">
      <path d="M2 30.4L6.1 30.8L10.3 31.1L14.4 31.2L18.5 31L22.6 30.7L26.7 30.3L30.8 29.7L34.8 29L38.8 28.2L42.9 27.3L46.9 26.3L50.9 25.2L54.9 24.1L58.8 23L62.8 21.8L66.7 20.6L70.7 19.4L74.6 18.2L78.5 17.1L82.4 16L86.3 15L90.2 14L94.1 13.1L98 12.4L101.9 11.7L105.7 11.2L109.6 10.8L113.4 10.6L117.3 10.5L121.1 10.7L124.9 11L129.3 11.7L133.4 12.8L137.2 14.3L140.9 16.1L144.4 18L147.7 20.1L151 22.3L154.3 24.5L157.6 26.6L161 28.6L164.5 30.3L168.2 31.8L172.1 32.9L176.2 33.5L180.5 33.6L185.2 33.2L188.2 32.2L191.2 30.6L194.2 28.5L197.2 26.1L200.3 23.4L203.5 20.5L206.8 17.7L210.2 15L213.8 12.5L217.5 10.4L221.5 8.8L225.6 7.9L230 7.7L232.8 8.1L235.6 9.1L238.1 10.6L240.3 12.5L242 14.6L243.2 16.8L243.6 19L243.3 21.1L242.1 23L239.8 24.6L237.5 25.3L235.4 25.3L233.4 24.8L231.7 23.7L230.3 22.4L229.4 20.8L229.1 19.2L229.4 17.7L230.3 16.4L232.1 15.4L233.2 15.1L234.3 15.1L235.3 15.4L236.1 15.8L236.9 16.3L237.4 16.9L237.6 17.5L237.6 18L237.4 18.3L236.9 18.6L237.1 19.4L238 18.9L238.4 18.1L238.4 17.3L238 16.5L237.4 15.8L236.6 15.1L235.5 14.6L234.4 14.4L233.2 14.3L231.9 14.6L229.8 15.8L228.6 17.4L228.3 19.3L228.7 21.1L229.7 22.9L231.2 24.4L233.1 25.6L235.3 26.2L237.7 26.2L240.2 25.4L242.8 23.6L244.2 21.4L244.6 19L244.2 16.5L243 14L241.1 11.7L238.8 9.7L236.1 8L233.1 6.9L230 6.3L225.4 6.5L221 7.4L216.9 9L212.9 11.1L209.2 13.6L205.6 16.3L202.2 19.1L199 21.8L195.9 24.5L192.9 26.8L190 28.7L187.3 30.1L184.8 30.8L180.4 31.2L176.4 31.1L172.6 30.5L169 29.4L165.6 28L162.2 26.4L158.9 24.5L155.7 22.4L152.4 20.3L149 18.1L145.6 16L141.9 14L138.1 12.3L134.1 10.8L129.7 9.7L125.1 9L121.2 8.8L117.3 8.7L113.3 8.9L109.4 9.2L105.5 9.7L101.6 10.3L97.7 11L93.8 11.8L89.9 12.8L86 13.8L82.1 14.9L78.2 16.1L74.3 17.3L70.4 18.5L66.5 19.7L62.5 20.9L58.6 22.1L54.6 23.3L50.7 24.5L46.7 25.5L42.7 26.5L38.7 27.5L34.7 28.3L30.6 29L26.6 29.6L22.6 30L18.5 30.3L14.4 30.4L10.3 30.4L6.2 30.1L2 29.6Z" />
    </svg>

    <!-- deco: de zonnestraal, verticale stralen die vanuit één punt
         openwaaieren naar hun hoek -->
    <svg class="orn orn-sunburst" viewBox="0 0 200 100" aria-hidden="true">
      <line
        v-for="(ray, i) in rays"
        :key="i"
        x1="100" y1="100" x2="100" :y2="100 - ray.length"
        :style="{ '--ray-angle': `${ray.angle}deg`, '--ray-delay': `${Math.abs(ray.angle) * 6}ms` }"
      />
      <path class="orn-sunburst-sun" d="M86 100A14 14 0 0 1 114 100Z" />
    </svg>

    <!-- messing: de manometer -->
    <svg class="orn orn-gauge" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="gauge-bezel" cx="100" cy="100" r="94" />
      <circle class="gauge-face" cx="100" cy="100" r="84" />
      <g class="gauge-rivets">
        <circle v-for="a in [45, 135, 225, 315]" :key="a"
          :cx="100 + 89 * Math.cos((a * Math.PI) / 180)"
          :cy="100 + 89 * Math.sin((a * Math.PI) / 180)" r="2.6" />
      </g>
      <line
        v-for="(t, i) in ticks"
        :key="`t${i}`"
        class="gauge-tick" :class="{ 'gauge-tick--major': t.major }"
        x1="100" y1="19" x2="100" :y2="t.major ? 31 : 26"
        :transform="`rotate(${t.angle} 100 100)`"
      />
      <text
        v-for="d in dial"
        :key="`n${d.n}`"
        class="gauge-numeral" :class="{ 'is-current': String(d.n) === String(number) }"
        :x="d.x" :y="d.y"
      >{{ d.n }}</text>
      <text class="gauge-legend" x="100" y="142">beweging</text>
      <g class="gauge-needle" :style="{ '--needle-angle': `${needle}deg` }">
        <path d="M100 106L97.4 100L100 28L102.6 100Z" />
        <circle cx="100" cy="100" r="7" />
      </g>
    </svg>

    <div class="section-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-xl) var(--space-2xl);
}

/* De grondornamenten die met het sectie-ornament zouden botsen gaan uit:
   twee zweepslagen of twee zonnestralen op één slide lezen als een fout.
   De gouden lijst van deco en de klinknagels van messing blijven. */
.slidev-layout.section.nouveau::before,
.slidev-layout.section.deco::before {
  display: none;
}

.orn {
  display: none;
  position: absolute;
  z-index: 0;
  pointer-events: none;
}
.section-body {
  position: relative;
  z-index: 1;
}
.section-body :deep(h1) {
  margin-bottom: var(--space-sm);
}
.section-body :deep(p) {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-quiet);
}

/* ── Nouveau ─────────────────────────────────────────────────────────
   De kop links, laag, in een groot cursief; de zweepslag slaat er
   breed overheen en loopt rechts buiten de slide uit. */
.slidev-layout.section.nouveau {
  justify-content: flex-end;
  padding: var(--space-xl) var(--space-2xl) var(--space-2xl) var(--space-xl);
}
.slidev-layout.section.nouveau .orn-whiplash {
  display: block;
  left: 3%;
  top: 7%;
  width: 92%;
  color: var(--nouveau-green);
  fill: currentColor;
  transform: rotate(-4deg);
}
.slidev-layout.section.nouveau .section-body :deep(h1) {
  font-size: calc(var(--step-6) * 1.15);
  line-height: 0.95;
  max-width: 15em;
}
@media (prefers-reduced-motion: no-preference) {
  .slidev-layout.section.nouveau .orn-whiplash {
    animation: whiplash-draw 1900ms cubic-bezier(0.55, 0.05, 0.3, 1) both;
  }
}
@keyframes whiplash-draw {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 -2% 0 0); }
}

/* ── Deco ────────────────────────────────────────────────────────────
   Alles op de as: de kop gecentreerd in kapitaal, de zonnestraal eronder
   die vanuit één punt openwaaiert. */
.slidev-layout.section.deco {
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  padding-top: 5.5rem;
}
.slidev-layout.section.deco .section-body {
  max-width: 80%;
}
.slidev-layout.section.deco .section-body :deep(h1) {
  font-size: calc(var(--step-6) * 0.9);
  letter-spacing: 0.12em;
  line-height: 1.1;
}
.slidev-layout.section.deco .orn-sunburst {
  display: block;
  left: 50%;
  bottom: 14px;
  width: 44%;
  transform: translateX(-50%);
  overflow: visible;
}
.orn-sunburst line {
  stroke: var(--deco-gold);
  stroke-width: 0.45;
  stroke-linecap: round;
  transform-box: view-box;
  transform-origin: 100px 100px;
  transform: rotate(var(--ray-angle));
}
.orn-sunburst .orn-sunburst-sun {
  fill: var(--deco-gold);
}
@media (prefers-reduced-motion: no-preference) {
  .slidev-layout.section.deco .orn-sunburst line {
    animation: ray-fan 1300ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
    animation-delay: var(--ray-delay);
  }
}
@keyframes ray-fan {
  from { transform: rotate(0deg) scaleY(0.2); opacity: 0; }
  to   { transform: rotate(var(--ray-angle)) scaleY(1); opacity: 1; }
}

/* ── Messing ─────────────────────────────────────────────────────────
   Links de manometer, rechts de kop op een geklonken koperen plaat. De
   wijzer slaat door en veert terug, zoals een naald die druk krijgt. */
.slidev-layout.section.messing {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-xl);
  padding: var(--space-xl) var(--space-xl) var(--space-xl) var(--space-lg);
}
.slidev-layout.section.messing .orn-gauge {
  display: block;
  position: relative;
  flex: 0 0 15rem;
  width: 15rem;
  height: 15rem;
  overflow: visible;
}
.slidev-layout.section.messing .section-body {
  flex: 1 1 auto;
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  background:
    radial-gradient(circle, var(--messing-brass-hi) 0 1px, var(--messing-brass) 1.8px 3px, var(--messing-brass-dark) 3.4px, transparent 4px)
      top 10px left 10px / 10px 10px no-repeat,
    radial-gradient(circle, var(--messing-brass-hi) 0 1px, var(--messing-brass) 1.8px 3px, var(--messing-brass-dark) 3.4px, transparent 4px)
      top 10px right 10px / 10px 10px no-repeat,
    radial-gradient(circle, var(--messing-brass-hi) 0 1px, var(--messing-brass) 1.8px 3px, var(--messing-brass-dark) 3.4px, transparent 4px)
      bottom 10px left 10px / 10px 10px no-repeat,
    radial-gradient(circle, var(--messing-brass-hi) 0 1px, var(--messing-brass) 1.8px 3px, var(--messing-brass-dark) 3.4px, transparent 4px)
      bottom 10px right 10px / 10px 10px no-repeat,
    linear-gradient(160deg, var(--messing-elevated), var(--color-bg) 70%);
  border: 2px solid var(--messing-copper);
  box-shadow:
    inset 0 0 0 4px var(--color-bg),
    inset 0 0 0 5px var(--messing-copper-dark),
    6px 8px 0 color-mix(in srgb, black 50%, transparent);
}
.slidev-layout.section.messing .section-body :deep(h1) {
  font-size: 2.9rem;
  line-height: 1.05;
}

.gauge-bezel {
  fill: none;
  stroke: var(--messing-brass);
  stroke-width: 8;
}
.gauge-face {
  fill: var(--messing-elevated);
  stroke: var(--messing-copper-dark);
  stroke-width: 1.5;
}
.gauge-rivets circle {
  fill: var(--messing-brass-hi);
  stroke: var(--messing-brass-dark);
  stroke-width: 0.8;
}
.gauge-tick {
  stroke: var(--messing-quiet);
  stroke-width: 1;
}
.gauge-tick--major {
  stroke: var(--messing-text);
  stroke-width: 2;
}
.gauge-numeral {
  font-family: var(--font-messing);
  font-size: 15px;
  fill: var(--messing-muted);
  text-anchor: middle;
  dominant-baseline: central;
}
.gauge-numeral.is-current {
  fill: var(--messing-copper);
  font-size: 21px;
}
.gauge-legend {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  fill: var(--messing-quiet);
  text-anchor: middle;
}
.gauge-needle {
  fill: var(--messing-copper);
  transform-box: view-box;
  transform-origin: 100px 100px;
  transform: rotate(var(--needle-angle));
}
.gauge-needle circle {
  fill: var(--messing-brass);
  stroke: var(--messing-brass-dark);
  stroke-width: 1.2;
}
@media (prefers-reduced-motion: no-preference) {
  .slidev-layout.section.messing .gauge-needle {
    animation: needle-swing 1800ms cubic-bezier(0.3, 1.5, 0.5, 1) both;
    animation-delay: 250ms;
  }
}
@keyframes needle-swing {
  from { transform: rotate(-120deg); }
  to   { transform: rotate(var(--needle-angle)); }
}
</style>
