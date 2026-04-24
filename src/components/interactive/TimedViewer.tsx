import { useState, useEffect, useRef } from "react";
import styles from "./TimedViewer.module.css";

const DEFAULT_DURATION = 180;

const DEFAULT_PROMPTS = [
  "Wat zag je het eerst?",
  "Wat zag je pas na een minuut?",
  "Wat begrijp je nu dat je eerst niet begreep?",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  readonly src: string;
  readonly alt: string;
  readonly credit: string;
  readonly duration?: number;
  readonly prompts?: string[];
  readonly intro?: string;
}

export default function TimedViewer({
  src,
  alt,
  credit,
  duration = DEFAULT_DURATION,
  prompts = DEFAULT_PROMPTS,
  intro = "Kijk. Alleen kijken. Niet lezen, niet analyseren, niet wegklikken.",
}: Props) {
  const [phase, setPhase] = useState<"idle" | "viewing" | "reflecting">("idle");
  const [remaining, setRemaining] = useState(duration);
  const [answers, setAnswers] = useState(prompts.map(() => ""));
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [phase]);

  useEffect(() => {
    if (phase !== "viewing") return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setPhase("reflecting");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    intervalRef.current = id;
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    setRemaining(duration);
    setAnswers(prompts.map(() => ""));
    setPhase("viewing");
  };

  const skip = () => {
    clearInterval(intervalRef.current);
    setPhase("reflecting");
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRemaining(duration);
    setAnswers(prompts.map(() => ""));
    setPhase("idle");
  };

  const updateAnswer = (idx: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const progress = 1 - remaining / duration;

  if (phase === "idle") {
    return (
      <div ref={rootRef} className={styles.root}>
        <p className={styles.label}>— oefening · {formatTime(duration)}</p>
        <h3 className={styles.heading}>
          Drie minuten <em className={styles.headingAccent}>kijken</em>.
        </h3>
        <p className={styles.intro}>{intro}</p>

        <div className={styles.imageWrap}>
          <img src={src} alt={alt} className={`${styles.image} ${styles.imageDimmed}`} />
          <div className={styles.overlay}>
            <button onClick={start} className={styles.btnPrimary}>
              start kijken →
            </button>
          </div>
        </div>

        <p className={styles.credit}>{credit}</p>
      </div>
    );
  }

  if (phase === "viewing") {
    return (
      <div ref={rootRef} className={styles.root}>
        <div className={styles.imageWrap}>
          <img src={src} alt={alt} className={styles.image} />
        </div>

        <div className={styles.timerRow}>
          <span className={styles.timerDisplay}>{formatTime(remaining)}</span>
          <div className={styles.timerTrack}>
            <div className={styles.timerFill} style={{ width: `${progress * 100}%` }} />
          </div>
          <button onClick={skip} className={styles.btnSecondary}>
            overslaan ↪
          </button>
        </div>

        <p className={styles.hint}>blijf kijken · niet wegklikken</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <p className={styles.label}>— drie vragen</p>
      <h3 className={styles.heading}>
        Neem even de <em className={styles.headingAccent}>tijd</em>.
      </h3>

      <div className={styles.thumbnail}>
        <img src={src} alt={alt} className={styles.thumbnailImg} />
        <p className={styles.thumbnailCredit}>{credit}</p>
      </div>

      <div className={styles.prompts}>
        {prompts.map((prompt, idx) => (
          <div key={prompt}>
            <div className={styles.promptRow}>
              <span className={styles.promptNumber}>{String(idx + 1).padStart(2, "0")}</span>
              <p className={styles.promptText}>{prompt}</p>
            </div>
            <textarea
              value={answers[idx]}
              onChange={(e) => updateAnswer(idx, e.target.value)}
              placeholder="Schrijf hier..."
              rows={3}
              className={styles.textarea}
            />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerNote}>je antwoorden blijven bij jou · niets wordt verzonden</p>
        <button onClick={reset} className={styles.btnGhost}>
          opnieuw kijken →
        </button>
      </div>
    </div>
  );
}
