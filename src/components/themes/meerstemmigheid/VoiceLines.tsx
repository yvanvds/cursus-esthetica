import { useEffect, useRef, useState } from 'react';
import styles from './VoiceLines.module.css';

// FASE 1 — prototype of the voice indicator for the triple listening comparator
// (#57). What is built here is only the core: the diagram that shows *how many*
// lines sound at once and *how they relate*. Audio playback (the YouTube
// fragments) comes in fase 2; the sweep below runs on the fragment duration
// taken from the chapter frontmatter, so the timing is already the real timing.
//
// The honest distinction the diagram has to carry:
//   - Léonin   — two lines in two lanes: one held, one dancing above it.
//   - Chakrulo — three lines in three lanes: a drone with two voices above.
//   - Erraji   — two lines in ONE lane: the same melody twice, not quite equal.
// Heterophony is therefore neither "one voice" nor "three voices": it is two
// tracings that share a lane and keep slipping apart. The lane count carries
// that; a bare number would not.

/** One fragment's video data, read from the chapter frontmatter by the wrapper. */
export interface FragmentVideo {
  key: string;
  title: string;
  source: string;
  start: number;
  end: number;
}

interface Props {
  fragments: FragmentVideo[];
}

/** A single sounding line, as a deterministic function of normalised time. */
interface Voice {
  /** Baseline height in viewBox units; lower number = higher pitch on screen. */
  y: number;
  /** Held notes are drawn thicker — they are the floor the rest rests on. */
  held?: boolean;
  /** Vertical excursion at time t (0..1), in viewBox units. */
  offset: (t: number) => number;
}

/** Chapter-specific content: what each fragment sounds like, as lines. */
interface FragmentShape {
  /** Tradition/place, so the three read as three independent inventions. */
  origin: string;
  /** The term the chapter uses for this texture. */
  term: string;
  /** The count, spelled out so heterophony is not forced into a number. */
  count: string;
  /** One sentence: what you hear. */
  gloss: string;
  /** Spoken description of the diagram, for screen readers. */
  described: string;
  voices: Voice[];
}

const VIEW_W = 320;
const VIEW_H = 96;
const SAMPLES = 180;

const TAU = Math.PI * 2;

/** Melisma: a fast ornamented line. */
const ornament = (t: number): number =>
  6.5 * Math.sin(TAU * 3.1 * t) + 3.2 * Math.sin(TAU * 8.7 * t + 1.1);

/** A held note is not perfectly still — a choir breathes. */
const held = (t: number): number => 0.6 * Math.sin(TAU * 1.3 * t);

const SHAPES: Record<string, FragmentShape> = {
  erraji: {
    origin: 'Marokko',
    term: 'heterofonie',
    count: '2 lijnen · 1 melodie',
    gloss: 'Oed en stem zingen dezelfde melodie tegelijk — net niet gelijk.',
    described:
      'Twee lijnen die samen één baan delen: dezelfde melodie, telkens een haar uit elkaar en weer samen.',
    // Both lines share ONE lane: same melody, two tracings.
    voices: [
      {
        y: 44,
        offset: (t) => 5.5 * Math.sin(TAU * 2.4 * t) + 2.4 * Math.sin(TAU * 6.1 * t + 0.4),
      },
      {
        y: 49,
        // The same function, a hair later and a hair wider, plus a slow drift
        // that opens and closes the gap: that gap *is* the heterophony.
        offset: (t) => {
          const lag = t + 0.018;
          const drift = 2.6 * Math.sin(Math.PI * 3 * t) ** 2;
          return (
            1.12 * (5.5 * Math.sin(TAU * 2.4 * lag) + 2.4 * Math.sin(TAU * 6.1 * lag + 0.4)) + drift
          );
        },
      },
    ],
  },
  chakrulo: {
    origin: 'Georgië',
    term: 'polyfonie',
    count: '3 lijnen · 3 stemmen',
    gloss: 'Een lage drone houdt de bodem vast; twee stemmen draaien erboven.',
    described:
      'Drie lijnen in drie banen: onderaan een aangehouden drone, daarboven twee stemmen die om elkaar heen bewegen.',
    voices: [
      { y: 78, held: true, offset: held },
      { y: 50, offset: (t) => 5.4 * Math.sin(TAU * 2.2 * t + 0.3) + 1.8 * Math.sin(TAU * 5.4 * t) },
      { y: 24, offset: (t) => 6.8 * Math.sin(TAU * 3.4 * t + 1.7) + 2.2 * Math.sin(TAU * 7.1 * t) },
    ],
  },
  leonin: {
    origin: 'Parijs, rond 1170',
    term: 'organum',
    count: '2 lijnen · 2 stemmen',
    gloss: 'Eén stem houdt een lange noot aan; de tweede fladdert erboven.',
    described:
      'Twee lijnen in twee banen: onderaan één noot die blijft liggen, daarboven een lijn die snel op en neer danst.',
    voices: [
      { y: 72, held: true, offset: held },
      { y: 30, offset: ornament },
    ],
  },
};

/** Sample a voice into an SVG polyline `points` string. */
function pointsFor(voice: Voice): string {
  const out: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = t * VIEW_W;
    const y = voice.y + voice.offset(t);
    out.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return out.join(' ');
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function VoiceLines({ fragments }: Readonly<Props>) {
  // One fragment sweeps at a time — the comparison is serial, never simultaneous.
  // `sweepKey` stays on the last fragment played, so its trace remains lit while
  // the others sit at zero.
  const [sweepKey, setSweepKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!running || sweepKey === null) return;
    const fragment = fragments.find((f) => f.key === sweepKey);
    if (!fragment) return;

    const durationMs = Math.max(1, fragment.end - fragment.start) * 1000;
    if (prefersReducedMotion()) {
      setProgress(1);
      setRunning(false);
      return;
    }

    const started = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / durationMs);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, sweepKey, fragments]);

  const toggle = (key: string) => {
    if (running && sweepKey === key) {
      setRunning(false);
      return;
    }
    setProgress(0);
    setSweepKey(key);
    setRunning(true);
  };

  return (
    <div className={styles.root}>
      <p className={styles.label}>— prototype · stemmen-indicatie (#57, fase 1)</p>
      <p className={styles.intro}>
        Drie keer meerstemmigheid, drie keer onafhankelijk uitgevonden. Tel de lijnen, en kijk
        vooral of ze elk een eigen baan hebben.
      </p>

      <div className={styles.grid}>
        {fragments.map((fragment) => {
          const shape = SHAPES[fragment.key];
          if (!shape) return null;
          const isSwept = sweepKey === fragment.key;
          const isActive = isSwept && running;
          const p = isSwept ? progress : 0;
          const clipId = `voicelines-${fragment.key}`;
          const lines = shape.voices.map((voice, i) => (
            <polyline
              key={i}
              points={pointsFor(voice)}
              className={voice.held ? `${styles.line} ${styles.lineHeld}` : styles.line}
              vectorEffect="non-scaling-stroke"
            />
          ));

          return (
            <figure key={fragment.key} className={styles.card}>
              <figcaption className={styles.head}>
                <span className={styles.origin}>{shape.origin}</span>
                <span className={styles.term}>{shape.term}</span>
              </figcaption>

              <svg
                className={styles.diagram}
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`${shape.count}. ${shape.described}`}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x="0" y="0" width={p * VIEW_W} height={VIEW_H} />
                  </clipPath>
                </defs>
                <g className={styles.base}>{lines}</g>
                <g className={styles.played} clipPath={`url(#${clipId})`}>
                  {lines}
                </g>
                {isActive && (
                  <line
                    className={styles.playhead}
                    x1={p * VIEW_W}
                    x2={p * VIEW_W}
                    y1="0"
                    y2={VIEW_H}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>

              <p className={styles.count}>{shape.count}</p>
              <p className={styles.gloss}>{shape.gloss}</p>

              <div className={styles.foot}>
                <button
                  type="button"
                  className={styles.sweep}
                  onClick={() => toggle(fragment.key)}
                  aria-label={
                    isActive
                      ? `Stop het verloop van ${fragment.title}`
                      : `Toon het verloop van ${fragment.title}`
                  }
                >
                  {isActive ? 'stop' : 'verloop'}
                </button>
                <span className={styles.timing}>
                  {formatClock(fragment.start)}–{formatClock(fragment.end)}
                </span>
              </div>

              <p className={styles.credit}>
                {fragment.title} · {fragment.source}
              </p>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
