import { useEffect, useRef, useState } from 'react';
import styles from './StringActionDemo.module.css';

// ── Mechanisms ─────────────────────────────────────────────────────────────

type Mechanism = 'vinger' | 'clavecimbel' | 'piano';

interface MechDef {
  id: Mechanism;
  label: string;
  sub: string;
}

const MECHS: MechDef[] = [
  { id: 'vinger', label: 'Vinger', sub: 'Hand op snaar — niets ertussen.' },
  {
    id: 'clavecimbel',
    label: 'Clavecimbel',
    sub: 'Een plectrum tokkelt: altijd dezelfde kracht, hoe je ook drukt.',
  },
  {
    id: 'piano',
    label: 'Piano',
    sub: 'Een hamer wordt geworpen: jouw aanslag bepaalt hoe hard.',
  },
];

// ── Geometry (SVG viewBox units) ─────────────────────────────────────────────

const VB_W = 120;
const VB_H = 96;
const X0 = 16;
const X1 = 104;
const L = X1 - X0;
const STRING_Y = 34;

const MAXPULL = 13; // upward lift for a pluck
const MAXSTRIKE = 11; // upward amplitude after a strike
const CYCLES = 3.5; // vibration cycles across the decay tail
const GAP = 16; // how far below the string an actuator starts

const APPROACH = 0.12; // pluck: actuator reaches the string
const REL = 0.42; // pluck: release point
const ESC = 0.3; // piano: escapement (let-off) — the hammer goes free
const CON = 0.4; // piano: hammer contacts the string
const CAUGHT = 0.52; // piano: rebound done, the back-check holds the hammer

// Piano hammer geometry (SVG units)
const HEAD_RX = 4;
const HEAD_RY = 5.5;
const H_REST = STRING_Y + 34; // parked, well below the string
const H_LETOFF = STRING_Y + 11; // the jack lets the hammer go here
const H_STRIKE = STRING_Y + HEAD_RY; // crown just touches the string
const H_CAUGHT = STRING_Y + 15; // held after the rebound
const H_PIVOT_DX = 26; // pivot sits left of the strike point
const H_PIVOT_DY = 40; // ...and below the string

const DURATION = 4200; // ms for one full play-through

// ── Helpers ──────────────────────────────────────────────────────────────────

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeIn = (x: number) => x * x;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Triangular "tent" shape peaking at fraction c, zero at both ends. */
function tent(u: number, c: number): number {
  if (c <= 0 || c >= 1) return 0;
  return u <= c ? u / c : (1 - u) / (1 - c);
}

const pluckPoint = (mech: Mechanism) => (mech === 'clavecimbel' ? 0.68 : 0.5);

// ── String displacement (returns dy in SVG units; negative = upward) ──────────

function stringDisp(mech: Mechanism, phase: number): (u: number) => number {
  if (mech === 'piano') {
    if (phase < CON) return () => 0;
    const post = (phase - CON) / (1 - CON);
    const amp = MAXSTRIKE * Math.exp(-2.6 * post) * Math.sin(2 * Math.PI * CYCLES * post);
    return (u) => -amp * Math.sin(Math.PI * u);
  }

  // Pluck mechanisms (vinger, clavecimbel)
  const c = pluckPoint(mech);
  if (phase < APPROACH) return () => 0;
  if (phase <= REL) {
    const p = easeOut((phase - APPROACH) / (REL - APPROACH));
    const amp = MAXPULL * p;
    return (u) => -amp * tent(u, c);
  }
  const post = (phase - REL) / (1 - REL);
  const amp = MAXPULL * Math.exp(-2.6 * post) * Math.cos(2 * Math.PI * CYCLES * post);
  return (u) => -amp * tent(u, c);
}

function buildPath(disp: (u: number) => number): string {
  const N = 56;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = X0 + u * L;
    const y = STRING_Y + disp(u);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d.trim();
}

/** While engaged, where the actuator tip sits (it rides the string apex). */
function pluckTipY(phase: number): number {
  if (phase < APPROACH) return STRING_Y + lerp(GAP, 0, phase / APPROACH);
  const p = easeOut((phase - APPROACH) / (REL - APPROACH));
  return STRING_Y - MAXPULL * p;
}

// ── Stage captions ────────────────────────────────────────────────────────────

interface Stage {
  n: string;
  title: string;
  body: string;
}

function stageFor(mech: Mechanism, phase: number): Stage {
  if (mech === 'piano') {
    if (phase < ESC)
      return { n: '01', title: 'Toets ingedrukt', body: 'De toets versnelt de hamer naar de snaar.' };
    if (phase < CON)
      return {
        n: '02',
        title: 'Echappement',
        body: 'De hamer komt vrij en vliegt de laatste afstand zelf.',
      };
    if (phase < CAUGHT)
      return { n: '03', title: 'Aanslag', body: 'De hamer raakt de snaar en kaatst meteen terug.' };
    return { n: '04', title: 'Vanger', body: 'Een vanger vangt de hamer op; de snaar trilt uit.' };
  }

  const released = (phase - REL) / (1 - REL);
  if (mech === 'clavecimbel') {
    if (phase < APPROACH)
      return { n: '01', title: 'De jack stijgt', body: 'Je drukt de toets; de jack met plectrum schiet omhoog.' };
    if (phase <= REL)
      return {
        n: '02',
        title: 'Tokkelen',
        body: 'De plectrum haakt onder de snaar en tilt haar op — even hard, hoe je ook drukt.',
      };
    if (released < 0.18)
      return { n: '03', title: 'Loslaten', body: 'De plectrum snapt voorbij de snaar. De toon staat vast.' };
    return { n: '04', title: 'Uittrillen', body: 'Geen controle meer: de snaar trilt vanzelf uit.' };
  }

  // vinger
  if (phase < APPROACH)
    return { n: '01', title: 'Aanraking', body: 'De vinger zoekt de snaar.' };
  if (phase <= REL)
    return {
      n: '02',
      title: 'Trekken',
      body: 'De vinger spant de snaar op — handmatig, met je eigen kracht.',
    };
  if (released < 0.18)
    return { n: '03', title: 'Loslaten', body: 'De snaar schiet los en begint te trillen.' };
  return { n: '04', title: 'Uittrillen', body: 'De toon sterft langzaam weg.' };
}

// ── Actuator drawings ─────────────────────────────────────────────────────────

function FingerActuator({ phase }: { phase: number }) {
  const x = X0 + pluckPoint('vinger') * L;
  const engaged = phase <= REL;
  let tipY: number;
  let opacity = 1;
  if (engaged) {
    tipY = pluckTipY(phase);
  } else {
    const post = (phase - REL) / (1 - REL);
    tipY = STRING_Y + lerp(2, GAP + 8, clamp01(post * 2));
    opacity = lerp(1, 0.2, clamp01(post * 1.6));
  }
  const w = 9;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={tipY} width={w} height={28} rx={w / 2} className={styles.finger} />
      <line
        x1={x - w / 2 + 1.5}
        y1={tipY + 10}
        x2={x + w / 2 - 1.5}
        y2={tipY + 10}
        className={styles.fingerJoint}
      />
    </g>
  );
}

function QuillActuator({ phase }: { phase: number }) {
  const x = X0 + pluckPoint('clavecimbel') * L;
  const plY = phase <= REL ? pluckTipY(phase) : STRING_Y - MAXPULL - 4;
  const jackTopY = plY + 2.5;
  const jw = 5;
  return (
    <g>
      {/* jack body */}
      <rect
        x={x - jw / 2}
        y={jackTopY}
        width={jw}
        height={VB_H - 6 - jackTopY}
        rx={1}
        className={styles.jack}
      />
      {/* plectrum (quill) reaching up toward the string */}
      <path
        d={`M${x - 3.5} ${jackTopY + 2} L${x + 1.5} ${jackTopY + 1} L${x} ${plY} Z`}
        className={styles.plectrum}
      />
    </g>
  );
}

function hammerHeadY(phase: number): number {
  // Driven by the key: accelerate up to the let-off point.
  if (phase < ESC) return lerp(H_REST, H_LETOFF, easeIn(phase / ESC));
  // Free flight: the hammer carries its speed the last bit to the string.
  if (phase < CON) return lerp(H_LETOFF, H_STRIKE, (phase - ESC) / (CON - ESC));
  // Immediate rebound, then held by the back-check.
  if (phase < CAUGHT) return lerp(H_STRIKE, H_CAUGHT, easeOut((phase - CON) / (CAUGHT - CON)));
  return H_CAUGHT;
}

function HammerActuator({ phase }: { phase: number }) {
  const x = X0 + pluckPoint('piano') * L;
  const pivotX = x - H_PIVOT_DX;
  const pivotY = STRING_Y + H_PIVOT_DY;
  const R = Math.hypot(x - pivotX, pivotY - H_STRIKE); // rigid shank length

  // The shank is rigid, so the head rides an arc of radius R around the pivot.
  const headY = hammerHeadY(phase);
  const headX = pivotX + Math.sqrt(Math.max(0, R * R - (pivotY - headY) ** 2));

  // Escapement jack: drives the knuckle, then slips aside at let-off and goes slack.
  const escaped = phase >= ESC;
  const jackTopY = (escaped ? hammerHeadY(ESC) : headY) + HEAD_RY;
  const jackX = x - 4 + (escaped ? lerp(0, -8, clamp01((phase - ESC) / 0.08)) : 0);
  const jackOpacity = escaped ? lerp(1, 0.3, clamp01((phase - ESC) / 0.1)) : 1;

  const caught = phase >= CAUGHT;
  const caughtX = pivotX + Math.sqrt(Math.max(0, R * R - (pivotY - H_CAUGHT) ** 2));

  return (
    <g>
      {/* escapement jack */}
      <rect
        x={jackX}
        y={jackTopY}
        width={4.5}
        height={pivotY - jackTopY}
        rx={1}
        opacity={jackOpacity}
        className={styles.escJack}
      />
      {/* back-check that catches the hammer after the rebound */}
      <rect
        x={caughtX + HEAD_RX - 1}
        y={H_CAUGHT - 1}
        width={6}
        height={7}
        rx={1}
        className={caught ? `${styles.check} ${styles.checkActive}` : styles.check}
      />
      {/* shank, pivot flange and felt head */}
      <line x1={pivotX} y1={pivotY} x2={headX} y2={headY} className={styles.hammerShank} />
      <rect x={pivotX - 2} y={pivotY - 1.5} width={4} height={3} rx={1} className={styles.hammerPivot} />
      <ellipse cx={headX} cy={headY} rx={HEAD_RX} ry={HEAD_RY} className={styles.hammerHead} />
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StringActionDemo() {
  const [mech, setMech] = useState<Mechanism>('vinger');
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = now - lastRef.current;
      lastRef.current = now;
      setPhase((p) => {
        const np = p + dt / DURATION;
        return np >= 1 ? 0 : np;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const chooseMech = (id: Mechanism) => {
    setMech(id);
    setPhase(0);
  };

  const scrub = (value: number) => {
    setPlaying(false);
    setPhase(value);
  };

  const current = MECHS.find((m) => m.id === mech)!;
  const stage = stageFor(mech, phase);
  const path = buildPath(stringDisp(mech, phase));

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.label}>— oefening · hoe een snaar gaat klinken</p>
        <h3 className={styles.heading}>
          Drie manieren om een <em className={styles.accent}>snaar</em> aan te slaan
        </h3>
        <p className={styles.intro}>
          Kies een mechaniek en sleep de schuif om de beweging stap voor stap te volgen — van
          aanraking tot uittrillen. Let op wat er tussen de hand en de snaar komt te staan.
        </p>
      </div>

      <div className={styles.toggle} role="group" aria-label="Kies een mechaniek">
        {MECHS.map((m, idx) => {
          const on = m.id === mech;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => chooseMech(m.id)}
              aria-pressed={on}
              className={on ? `${styles.toggleBtn} ${styles.toggleBtnActive}` : styles.toggleBtn}
            >
              <span className={styles.toggleNumber}>{String(idx + 1).padStart(2, '0')}</span>
              <span className={styles.toggleLabel}>{m.label}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.sub}>{current.sub}</p>

      <div className={styles.stage}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={`${current.label}: ${stage.title}. ${stage.body}`}
        >
          {/* anchor posts (nut / bridge) */}
          <rect x={X0 - 2} y={STRING_Y - 7} width={3} height={14} className={styles.post} />
          <rect x={X1 - 1} y={STRING_Y - 7} width={3} height={14} className={styles.post} />
          {/* rest position of the string */}
          <line x1={X0} y1={STRING_Y} x2={X1} y2={STRING_Y} className={styles.restLine} />

          {mech === 'piano' && <HammerActuator phase={phase} />}
          {mech === 'clavecimbel' && <QuillActuator phase={phase} />}
          {mech === 'vinger' && <FingerActuator phase={phase} />}

          {/* live string, drawn last so it reads on top */}
          <path d={path} className={styles.string} />
        </svg>

        <div className={styles.caption}>
          <span className={styles.captionNum}>{stage.n}</span>
          <div>
            <p className={styles.captionTitle}>{stage.title}</p>
            <p className={styles.captionBody}>{stage.body}</p>
          </div>
        </div>
      </div>

      <div className={styles.transport}>
        <button
          type="button"
          className={styles.play}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pauzeer' : 'Speel af'}
        >
          {playing ? (
            <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.icon}>
              <rect x="2" y="1.5" width="3" height="9" />
              <rect x="7" y="1.5" width="3" height="9" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.icon}>
              <path d="M2.5 1.5 L10 6 L2.5 10.5 Z" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(phase * 1000)}
          onChange={(e) => scrub(Number(e.target.value) / 1000)}
          className={styles.slider}
          aria-label="Beweeg door de aanslag"
        />
        <button
          type="button"
          className={styles.reset}
          onClick={() => scrub(0)}
          aria-label="Terug naar het begin"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
