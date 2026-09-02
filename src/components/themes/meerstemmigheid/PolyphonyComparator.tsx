import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './PolyphonyComparator.module.css';

// Drievoudige luistercomparator (#57). Three fragments side by side, each with
// its own player and a diagram of how many lines sound at once.
//
// Order is Erraji — Chakrulo — Léonin, deliberately. The chapter calls Léonin
// "de eerste van wie we de naam kennen" and corrects that in the next breath
// with "andere culturen waren ons voor". Putting Léonin last makes the card row
// carry the correction instead of the misconception.
//
// ─── About the contours ──────────────────────────────────────────────────────
// These are NOT transcriptions. Nobody here listened to the recordings. Each
// line sits on a pitch grid — documented where a source supports one, neutral
// where none was found — and the notes on that grid are authored to match the
// documented *texture*, not to reproduce a melody. How far each card goes
// beyond its source is recorded per fragment below, and the component says out
// loud to the student that this is a scheme, not a score.
//
//   leonin   — grid: the chant's mode 5 (final F, reciting tone C), diatonic.
//              Source-borne: the tenor sustains chant notes for very long
//              stretches while the duplum runs florid melismas above it, and
//              the mode-5 intonation rises like an arpeggio (F–A–C). Authored:
//              where exactly the four tenor changes fall inside 0–90 s, and
//              every individual duplum note. The duplum cadences onto a perfect
//              consonance (octave or fifth) with the tenor at each change —
//              standard organum purum practice, not a reading of this take.
//   chakrulo — grid: neutral equal steps. Georgian tuning is famously not
//              tempered and no transcription was found, so claiming intervals
//              would be a fabrication. Source-borne: a *pedal* drone (bani)
//              under two ornamented solo lines that move both independently and
//              together. Authored: every note, and the crossing of the two
//              soloists.
//   erraji   — grid: maqam Nikriz (jins Nikriz C D E♭ F♯ + jins Rast on the
//              fifth G A B♭ C). The wide gap between the third and fourth step
//              is the augmented second, and that much is real. Nothing else
//              here is: no score, no transcription, live performance. So the
//              two lines are deliberately drawn flat — a few long terraces on
//              the maqam's steps, not a contour. They claim only what is
//              actually known: two tracks taking the same path, the second
//              entering a touch later and carrying an ornament more, arriving
//              together at the close. That is what heterophony *is*; it is not
//              a reading of this take, and the drawing does not pretend to be
//              a melody.

/** One fragment's video data, read from the chapter frontmatter by the wrapper. */
export interface FragmentVideo {
  key: string;
  youtube: string;
  title: string;
  source: string;
  start: number;
  end: number;
}

interface Props {
  fragments: FragmentVideo[];
}

/** A note as [onset in normalised fragment time, step on the fragment's grid]. */
type Note = [t: number, step: number];

interface Line {
  notes: Note[];
  /** Sustained lines (a held chant note, a pedal drone) are drawn heavier. */
  held?: boolean;
  /** Vertical nudge so two lines sharing one lane stay tellable apart. */
  nudge?: number;
}

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
  /** Step on the fragment's grid → y in viewBox units. */
  yOf: (step: number) => number;
  lines: Line[];
}

const VIEW_W = 320;
const VIEW_H = 96;

/* ── Léonin ─────────────────────────────────────────────────────────────────
   Grid: semitones above the chant's final F. 2.6 units per semitone. */
const leoninY = (semitones: number): number => 80 - 2.6 * semitones;

// Four sustained chant notes: F, A, C, A — the rising mode-5 intonation.
const LEONIN_TENOR: Note[] = [
  [0, 0],
  [0.34, 4],
  [0.62, 7],
  [0.86, 4],
];

// Florid melisma above it, cadencing onto an octave or fifth over the tenor
// exactly where the tenor changes note.
const LEONIN_DUPLUM: Note[] = [
  [0.0, 7], [0.03, 9], [0.055, 11], [0.075, 12], [0.1, 11], [0.12, 9], [0.145, 11],
  [0.17, 12], [0.2, 14], [0.225, 12], [0.25, 11], [0.275, 9], [0.3, 11], [0.32, 12],
  [0.34, 12], [0.365, 14], [0.39, 16], [0.415, 14], [0.44, 12], [0.46, 14], [0.485, 16],
  [0.51, 14], [0.535, 12], [0.555, 11], [0.575, 12], [0.595, 14], [0.61, 16],
  [0.62, 16], [0.645, 17], [0.67, 16], [0.695, 14], [0.72, 12], [0.745, 11], [0.77, 12],
  [0.795, 14], [0.82, 16], [0.845, 14],
  [0.86, 14], [0.885, 12], [0.91, 14], [0.945, 16],
];

/* ── Chakrulo ───────────────────────────────────────────────────────────────
   Grid: neutral equal steps — Georgian tuning is not tempered and no
   transcription was found, so no interval claim is made. */
const chakruloY = (step: number): number => 88 - 4.2 * step;

const CHAKRULO_DRONE: Note[] = [[0, 2]];

const CHAKRULO_SECOND: Note[] = [
  [0.0, 7], [0.04, 8], [0.075, 7], [0.1, 6], [0.13, 7], [0.17, 9], [0.2, 8], [0.235, 7],
  [0.27, 6], [0.3, 7], [0.34, 8], [0.375, 9], [0.41, 8], [0.44, 7], [0.48, 6], [0.51, 7],
  [0.55, 8], [0.59, 7], [0.63, 9], [0.665, 8], [0.7, 7], [0.735, 6], [0.77, 7], [0.81, 8],
  [0.85, 9], [0.885, 8], [0.92, 7], [0.96, 6],
];

const CHAKRULO_LEAD: Note[] = [
  [0.0, 11], [0.035, 12], [0.07, 11], [0.105, 10], [0.14, 11], [0.175, 13], [0.21, 12],
  [0.245, 11], [0.28, 10], [0.315, 9], [0.35, 10], [0.385, 12], [0.42, 13], [0.455, 12],
  [0.49, 11], [0.525, 10], [0.56, 11], [0.6, 13], [0.64, 14], [0.675, 13], [0.71, 12],
  [0.745, 11], [0.78, 10], [0.82, 11], [0.86, 12], [0.9, 13], [0.94, 12], [0.975, 11],
];

/* ── Erraji ─────────────────────────────────────────────────────────────────
   Grid: maqam Nikriz, in semitones above the tonic. The 3-semitone gap between
   step 2 and step 3 is the augmented second — the one hard fact available. */
const NIKRIZ = [0, 2, 3, 6, 7, 9, 10, 12];
const errajiY = (step: number): number => 68 - 3.0 * (NIKRIZ[step] ?? 0);

// Long terraces, not a contour. The two big steps between F♯ (step 3) and E♭
// (step 2) are the augmented second — the one thing on this card worth showing.
const ERRAJI_VOICE: Note[] = [
  [0.0, 4], [0.2, 3], [0.42, 2], [0.64, 3], [0.82, 1], [0.94, 0],
];

// The same path on the oud: every terrace entered a touch later, three small
// ornaments extra, and the same close.
const ERRAJI_OUD: Note[] = [
  [0.0, 4], [0.235, 3], [0.3, 4], [0.335, 3], [0.46, 2], [0.6, 3], [0.635, 2],
  [0.675, 3], [0.855, 2], [0.885, 1], [0.965, 0],
];

const SHAPES: Record<string, FragmentShape> = {
  erraji: {
    origin: 'Marokko',
    term: 'heterofonie',
    count: '2 lijnen · 1 melodie',
    gloss: 'Stem en oed volgen dezelfde lijn, telkens een haar uit elkaar.',
    described:
      'Twee sporen die samen één baan delen: dezelfde weg over de treden van de toonladder, het tweede spoor telkens iets later en met een versiering meer, samen aankomend op het slot.',
    yOf: errajiY,
    lines: [{ notes: ERRAJI_VOICE }, { notes: ERRAJI_OUD, nudge: 3.4 }],
  },
  chakrulo: {
    origin: 'Georgië',
    term: 'polyfonie',
    count: '3 lijnen · 3 stemmen',
    gloss: 'Een lage drone houdt de bodem vast; twee zangers bewegen erboven.',
    described:
      'Drie lijnen in drie banen: onderaan een drone die blijft liggen, daarboven twee zangers die om elkaar heen bewegen en elkaar af en toe raken.',
    yOf: chakruloY,
    lines: [
      { notes: CHAKRULO_DRONE, held: true },
      { notes: CHAKRULO_SECOND },
      { notes: CHAKRULO_LEAD },
    ],
  },
  leonin: {
    origin: 'Parijs, rond 1170',
    term: 'organum',
    count: '2 lijnen · 2 stemmen',
    gloss: 'Eén stem houdt een lange noot aan; de tweede fladdert erboven.',
    described:
      'Twee lijnen in twee banen: onderaan vier zeer lang aangehouden noten, daarboven een lijn die in snelle stappen op en neer danst en telkens bij een wisseling samenvalt met de onderste.',
    yOf: leoninY,
    lines: [{ notes: LEONIN_TENOR, held: true }, { notes: LEONIN_DUPLUM }],
  },
};

/** Render a note list as a step function: each note is a horizontal segment. */
function steppedPoints(line: Line, yOf: (step: number) => number): string {
  const nudge = line.nudge ?? 0;
  const out: string[] = [];
  line.notes.forEach(([t, step], i) => {
    const next = line.notes[i + 1];
    const x0 = t * VIEW_W;
    const x1 = (next ? next[0] : 1) * VIEW_W;
    const y = yOf(step) + nudge;
    out.push(`${x0.toFixed(2)},${y.toFixed(2)}`, `${x1.toFixed(2)},${y.toFixed(2)}`);
  });
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

function watchUrl(fragment: FragmentVideo): string {
  return `https://www.youtube.com/watch?v=${fragment.youtube}&t=${Math.round(fragment.start)}s`;
}

/* ── YouTube iframe API ─────────────────────────────────────────────────────
   Typed by hand rather than pulled in as a dependency: the surface we use is
   four methods wide. */

interface YTPlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  playVideo: () => void;
}

interface YTEvent {
  target: YTPlayer;
  data?: number;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (event: YTEvent) => void;
    onError: () => void;
    onStateChange: (event: YTEvent) => void;
  };
}

interface YTNamespace {
  Player: new (host: HTMLElement, options: YTPlayerOptions) => YTPlayer;
  PlayerState: { ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_TIMEOUT_MS = 8000;
let apiPromise: Promise<YTNamespace> | null = null;

/** Load the iframe API once per page, and fail loudly rather than hang. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const timer = window.setTimeout(
      () => reject(new Error('youtube-api-timeout')),
      API_TIMEOUT_MS,
    );
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('youtube-api-missing'));
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('youtube-api-blocked'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function PolyphonyComparator({ fragments }: Readonly<Props>) {
  // One fragment at a time — the comparison is serial. `sweepKey` stays on the
  // last fragment played so its trace remains lit while the others sit at zero.
  const [sweepKey, setSweepKey] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  // Before hydration there is no player, so the control is a plain link. It only
  // becomes a button once this flips — that is the no-JS fallback.
  const [ready, setReady] = useState(false);

  const hostRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => setReady(true), []);

  const setHostRef = useCallback((key: string, node: HTMLDivElement | null) => {
    hostRefs.current[key] = node;
  }, []);

  useEffect(() => {
    if (playingKey === null) return;
    const fragment = fragments.find((f) => f.key === playingKey);
    const host = hostRefs.current[playingKey];
    if (!fragment || !host) return;

    const span = Math.max(1, fragment.end - fragment.start);
    const reduced = prefersReducedMotion();
    let player: YTPlayer | null = null;
    let raf = 0;
    let cancelled = false;

    // The sweep hangs on the player's real clock, not on a timer, so it cannot
    // drift away from what you are hearing.
    const follow = () => {
      if (cancelled || !player) return;
      const elapsed = player.getCurrentTime() - fragment.start;
      setProgress(Math.min(1, Math.max(0, elapsed / span)));
      raf = requestAnimationFrame(follow);
    };

    const mount = document.createElement('div');
    host.appendChild(mount);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          videoId: fragment.youtube,
          playerVars: {
            // Timing comes from the chapter frontmatter, via props.
            start: Math.round(fragment.start),
            end: Math.round(fragment.end),
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              event.target.playVideo();
              if (reduced) setProgress(1);
              else follow();
            },
            onError: () => {
              setFailed(true);
              setPlayingKey(null);
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.ENDED) {
                setProgress(1);
                setPlayingKey(null);
              }
            },
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setPlayingKey(null);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      player?.destroy();
      // The API replaces `mount` with an iframe; React owns only `host`, and it
      // has no React children, so clearing it here is safe.
      host.replaceChildren();
    };
  }, [playingKey, fragments]);

  const toggle = (key: string) => {
    if (playingKey === key) {
      setPlayingKey(null);
      return;
    }
    setProgress(0);
    setSweepKey(key);
    setPlayingKey(key);
  };

  return (
    <div className={styles.root}>
      <p className={styles.label}>— luisteren · drie keer meerstemmigheid</p>
      <p className={styles.intro}>
        Drie tradities die elk hun eigen weg gingen. Speel ze na elkaar af en tel de banen: één
        baan per stem — behalve bij Erraji, waar twee lijnen dezelfde baan delen.
      </p>

      {failed && (
        <p className={styles.warning}>
          De speler laadt niet. Hieronder staat bij elk fragment een link naar YouTube.
        </p>
      )}

      <div className={styles.grid}>
        {fragments.map((fragment) => {
          const shape = SHAPES[fragment.key];
          if (!shape) return null;
          const isSwept = sweepKey === fragment.key;
          const isPlaying = playingKey === fragment.key;
          const p = isSwept ? progress : 0;
          const clipId = `polyphony-${fragment.key}`;
          const lines = shape.lines.map((line, i) => (
            <polyline
              key={i}
              points={steppedPoints(line, shape.yOf)}
              className={line.held ? `${styles.line} ${styles.lineHeld}` : styles.line}
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
                {isPlaying && p > 0 && p < 1 && (
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
                {ready && !failed ? (
                  <button
                    type="button"
                    className={styles.play}
                    onClick={() => toggle(fragment.key)}
                    aria-label={
                      isPlaying ? `Stop ${fragment.title}` : `Speel ${fragment.title} af`
                    }
                  >
                    {isPlaying ? 'stop' : 'speel'}
                  </button>
                ) : (
                  <a className={styles.play} href={watchUrl(fragment)} rel="noopener">
                    beluister
                  </a>
                )}
                <span className={styles.timing}>
                  {formatClock(fragment.start)}–{formatClock(fragment.end)}
                </span>
              </div>

              <div
                className={isPlaying ? styles.player : styles.playerHidden}
                ref={(node) => {
                  setHostRef(fragment.key, node);
                }}
              />

              <p className={styles.credit}>
                {fragment.title} · {fragment.source}
              </p>
            </figure>
          );
        })}
      </div>

      <p className={styles.disclaimer}>
        De lijnen zijn een schema, geen partituur. Ze tonen hoeveel stemmen er klinken en hoe die
        zich tot elkaar verhouden — niet welke noten er precies gezongen worden.
      </p>
    </div>
  );
}
