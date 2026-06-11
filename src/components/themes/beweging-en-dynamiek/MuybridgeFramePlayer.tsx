import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './MuybridgeFramePlayer.module.css';

// A frame-player for Muybridge's "Horse in Motion" plates (1878). The student
// steps through the stills, then *chooses which ones belong in the loop* and
// presses play to test it. Muybridge over-captured — one plate repeats the
// first, the last two show the horse easing to a standstill — so building a
// smooth gallop means discovering which frames to drop. That discovery is the
// whole pedagogical point of the section.

const FPS_MIN = 2;
const FPS_MAX = 24;
const FPS_DEFAULT = 12;

export default function MuybridgeFramePlayer({ frames }: Readonly<{ frames: string[] }>) {
  const total = frames.length;
  const [included, setIncluded] = useState<boolean[]>(() => frames.map(() => true));
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(FPS_DEFAULT);
  const stripRef = useRef<HTMLDivElement>(null);

  // The sequence the student has assembled: frame indices still switched on.
  const seq = useMemo(() => frames.map((_, i) => i).filter((i) => included[i]), [frames, included]);
  const len = seq.length;
  const safePos = len ? ((pos % len) + len) % len : 0;
  const currentIdx = len ? seq[safePos] : -1;

  // Advance through the chosen sequence while playing, framerate-correct.
  useEffect(() => {
    if (!playing || len === 0) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      acc += now - last;
      last = now;
      const interval = 1000 / fps;
      if (acc >= interval) {
        const steps = Math.floor(acc / interval);
        acc -= steps * interval;
        setPos((p) => (p + steps) % len);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, fps, len]);

  // Keep the active thumbnail in view as the sequence plays / steps.
  useEffect(() => {
    if (currentIdx < 0) return;
    const active = stripRef.current?.children[currentIdx] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentIdx]);

  const step = (delta: number) => {
    setPlaying(false);
    if (len) setPos((p) => (((p + delta) % len) + len) % len);
  };

  const togglePlay = () => setPlaying((p) => !p);

  const toggleInclude = (i: number) =>
    setIncluded((prev) => prev.map((v, j) => (j === i ? !v : v)));

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.label}>— oefening · stel je eigen galop samen</p>
        <h3 className={styles.heading}>
          Maak de <em className={styles.accent}>beweging</em> zelf
        </h3>
        <p className={styles.intro}>
          Muybridge legde meer vast dan één zuivere sprong: sommige standen lijken op elkaar, en
          achteraan komt het paard tot stilstand. Klik hieronder standen aan of uit en stel zo zelf
          de reeks samen die vloeiend blijft doorgalopperen. Stap met de pijlen door je reeks en druk
          op afspelen om te testen — welke standen kun je missen?
        </p>
      </div>

      <figure
        className={styles.stage}
        aria-label={currentIdx >= 0 ? `Stand ${currentIdx + 1} van ${total}` : 'Geen stand gekozen'}
      >
        {frames.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Muybridge, The Horse in Motion — stand ${i + 1} van ${total}`}
            className={i === currentIdx ? `${styles.frame} ${styles.frameActive}` : styles.frame}
            draggable={false}
            aria-hidden={i !== currentIdx}
          />
        ))}
        {currentIdx < 0 && <p className={styles.empty}>Kies minstens één stand hieronder.</p>}
        {len > 0 && (
          <span className={styles.counter}>
            {String(safePos + 1).padStart(2, '0')} / {String(len).padStart(2, '0')}
          </span>
        )}
      </figure>

      <div className={styles.transport}>
        <button
          type="button"
          className={styles.ctrl}
          onClick={() => step(-1)}
          aria-label="Vorige stand"
          disabled={!len}
        >
          ‹
        </button>
        <button
          type="button"
          className={styles.play}
          onClick={togglePlay}
          aria-label={playing ? 'Pauzeer' : 'Speel je galop af'}
          disabled={!len}
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
        <button
          type="button"
          className={styles.ctrl}
          onClick={() => step(1)}
          aria-label="Volgende stand"
          disabled={!len}
        >
          ›
        </button>

        <input
          type="range"
          min={0}
          max={Math.max(0, len - 1)}
          value={safePos}
          onChange={(e) => {
            setPlaying(false);
            setPos(Number(e.target.value));
          }}
          className={styles.slider}
          aria-label="Kies een stand in je reeks"
          disabled={len < 2}
        />

        <label className={styles.speed}>
          <span className={styles.speedValue}>{fps} fps</span>
          <input
            type="range"
            min={FPS_MIN}
            max={FPS_MAX}
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className={styles.speedSlider}
            aria-label="Afspeelsnelheid in beelden per seconde"
          />
        </label>
      </div>

      <p className={styles.stripLabel}>
        Welke standen horen in de animatie? Klik om aan of uit te zetten.
      </p>
      <div className={styles.strip} ref={stripRef}>
        {frames.map((src, i) => {
          const on = included[i];
          const cls = [
            styles.thumb,
            on ? styles.thumbOn : '',
            i === currentIdx ? styles.thumbCurrent : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={src}
              type="button"
              className={cls}
              onClick={() => toggleInclude(i)}
              aria-pressed={on}
              aria-label={`Stand ${i + 1} ${on ? 'uit de animatie halen' : 'in de animatie opnemen'}`}
            >
              <img src={src} alt="" className={styles.thumbImg} draggable={false} />
              <span className={styles.thumbNum}>{i + 1}</span>
              {on && (
                <span className={styles.thumbCheck} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className={styles.caption}>
        Eadweard Muybridge · The Horse in Motion · 1878 · Sallie Gardner in galop, opgenomen met
        twaalf camera's langs de baan
      </p>
    </div>
  );
}
