import { useEffect, useRef, useState } from 'react';
import styles from './HandscrollViewer.module.css';

// A horizontal viewer for Huaisu's handscroll (23427×480px). A handscroll is
// never shown all at once: you hold the right end and unroll it leftward with
// the other hand, one shoulder-width at a time. So this viewer starts at the
// far right and only moves left — and it moves *slowly*: all input feeds a
// target position that the view eases toward, hard-capped at a reading pace.
// Fast flinging is impossible by design; the contemplative gesture is the point.

const MAX_SPEED = 320; // px/s — the hard ceiling on how fast the view may move
const EASE_RATE = 9; // 1/s — exponential smoothing toward the target
const LEAD_FRAC = 0.85; // target may lead the view by at most this × viewport
const KEY_STEP_FRAC = 0.18; // arrow-key nudge as a fraction of the viewport

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export default function HandscrollViewer({ src }: Readonly<{ src: string }>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // offset (px) = how far the strip is shifted left. 0 = strip's left edge at
  // the viewport (the END of the reading); max = far right (the START).
  const offsetRef = useRef(0);
  const targetRef = useRef(0);
  const maxRef = useRef(0);
  const progressRef = useRef(0); // 0 at start (right) … 1 at end (left)
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  const [offset, setOffset] = useState(0);
  const [max, setMax] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  // ── Measure the strip and place the view at the far right (the start) ──────
  const measure = (keepProgress: boolean) => {
    const vp = viewportRef.current;
    const strip = stripRef.current;
    if (!vp || !strip) return;
    const m = Math.max(0, strip.scrollWidth - vp.clientWidth);
    maxRef.current = m;
    setMax(m);
    const next = keepProgress ? (1 - progressRef.current) * m : m;
    offsetRef.current = next;
    targetRef.current = next;
    setOffset(next);
    progressRef.current = m > 0 ? 1 - next / m : 0;
  };

  const onImgLoad = () => {
    measure(false);
    setReady(true);
  };

  // The island is hydrated after the server-rendered <img> is already in the
  // DOM, so for a cached/already-decoded image the React onLoad never fires.
  // Detect that case on mount and measure immediately.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) onImgLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => measure(true));
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  // ── Animation loop: ease offset → target, capped at MAX_SPEED ──────────────
  // Re-created when `playing` toggles so it reads a fresh value of the flag.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = maxRef.current;
      const cur = offsetRef.current;

      // While playing, keep pulling the target toward the end (offset 0), but
      // never further than LEAD ahead so the speed cap governs the motion.
      if (playing) {
        const lead = (viewportRef.current?.clientWidth ?? 0) * LEAD_FRAC;
        targetRef.current = Math.max(0, cur - lead);
      }

      const diff = targetRef.current - cur;
      let next: number;
      if (Math.abs(diff) < 0.5) {
        next = targetRef.current;
      } else {
        const eased = diff * (1 - Math.exp(-EASE_RATE * dt));
        const capped = clamp(eased, -MAX_SPEED * dt, MAX_SPEED * dt);
        next = cur + capped;
      }

      if (next !== cur) {
        offsetRef.current = next;
        progressRef.current = m > 0 ? 1 - next / m : 0;
        setOffset(next);
      }

      if (playing && next <= 0.5) setPlaying(false); // reached the end
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // ── Drag to unroll ─────────────────────────────────────────────────────────
  const nudgeTarget = (delta: number) => {
    const m = maxRef.current;
    const lead = (viewportRef.current?.clientWidth ?? 0) * LEAD_FRAC;
    const cur = offsetRef.current;
    // Stay within one lead of what is actually on screen, so a fast gesture
    // cannot send the target running far ahead (no long inertial slide).
    targetRef.current = clamp(clamp(targetRef.current + delta, cur - lead, cur + lead), 0, m);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    setPlaying(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    // Drag right (dx > 0) pulls the paper right → reveals content to the left
    // → advances the reading → offset decreases.
    nudgeTarget(-dx);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const vw = viewportRef.current?.clientWidth ?? 0;
    const step = vw * KEY_STEP_FRAC;
    switch (e.key) {
      case 'ArrowLeft': // advance the reading (move toward the left end)
        e.preventDefault();
        setPlaying(false);
        nudgeTarget(-step);
        break;
      case 'ArrowRight': // back toward the start
        e.preventDefault();
        setPlaying(false);
        nudgeTarget(step);
        break;
      case 'Home': // jump straight back to the start (right)
        e.preventDefault();
        reset();
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        togglePlay();
        break;
      default:
    }
  };

  const togglePlay = () => setPlaying((p) => !p);

  const reset = () => {
    setPlaying(false);
    const m = maxRef.current;
    offsetRef.current = m;
    targetRef.current = m;
    progressRef.current = 0;
    setOffset(m);
  };

  const progress = max > 0 ? 1 - offset / max : 0;
  const atStart = max === 0 || offset >= max - 0.5;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.label}>— handrol · 777 · gelezen van rechts naar links</p>
        <h3 className={styles.heading}>
          Rol de <em className={styles.accent}>Autobiografie</em> zelf af
        </h3>
        <p className={styles.intro}>
          Een handrol toon je nooit in één keer. Je houdt hem rechts vast en rolt hem met de andere
          hand langzaam naar links open — één schouderbreedte tegelijk. Doe dat hier ook: sleep de
          rol naar links, of laat hem vanzelf afrollen. Niet de tekst telt, maar de snelheid van de
          hand die je volgt.
        </p>
      </div>

      <div
        ref={viewportRef}
        className={styles.viewport}
        role="slider"
        aria-label="Handrol van Huaisu's Autobiografie. Sleep naar links om te lezen, of gebruik de pijltjestoetsen."
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuetext={atStart ? 'begin van de rol' : `${Math.round(progress * 100)} procent afgerold`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <div
          ref={stripRef}
          className={ready ? `${styles.strip} ${styles.stripReady}` : styles.strip}
          style={{ transform: `translateX(${-offset}px)` }}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Huaisu, Autobiografie (777): zevenhonderdtwee karakters in wild cursief (kuangcao) over een handrol van zevenenhalve meter."
            className={styles.img}
            draggable={false}
            loading="lazy"
            decoding="async"
            onLoad={onImgLoad}
          />
        </div>
        <div className={styles.vignetteLeft} aria-hidden="true" />
        <div className={styles.vignetteRight} aria-hidden="true" />
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.play}
          onClick={togglePlay}
          aria-label={playing ? 'Pauzeer' : 'Rol langzaam af'}
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

        <div className={styles.progress}>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${progress * 100}%` }} />
          </div>
          <div className={styles.ends}>
            <span>einde</span>
            <span>begin</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.reset}
          onClick={reset}
          disabled={atStart}
          aria-label="Terug naar het begin (rechts)"
        >
          ↺
        </button>
      </div>

      <p className={styles.caption}>
        Huaisu · Autobiografie (自叙帖) · 777 · inkt op papier · National Palace Museum, Taipei
      </p>
    </div>
  );
}
