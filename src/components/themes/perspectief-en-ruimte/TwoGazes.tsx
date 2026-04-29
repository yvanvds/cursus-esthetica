import { useState } from 'react';
import styles from './TwoGazes.module.css';

type MarkerId = 'verdwijnpunt' | 'hierarchie' | 'achtergrond' | 'ooghoogte';

interface MarkerDef {
  id: MarkerId;
  label: string;
}

const MARKERS: MarkerDef[] = [
  { id: 'verdwijnpunt', label: 'Lijnen naar het verdwijnpunt' },
  { id: 'hierarchie', label: 'Hiërarchische grootte' },
  { id: 'achtergrond', label: 'Achtergrond' },
  { id: 'ooghoogte', label: 'Ooghoogte' },
];

type ActiveState = Record<MarkerId, boolean>;

interface Props {
  cimabueSrc: string;
  athensSrc: string;
}

export default function TwoGazes({ cimabueSrc, athensSrc }: Props) {
  const [active, setActive] = useState<ActiveState>({
    verdwijnpunt: false,
    hierarchie: false,
    achtergrond: false,
    ooghoogte: false,
  });

  const toggle = (id: MarkerId) =>
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className={styles.root}>
      <div className={styles.images}>
        <figure className={styles.figure}>
          <div className={styles.imageWrap}>
            <img
              src={cimabueSrc}
              alt="Cimabue, Maestà di Santa Trinità (ca. 1280) — Maria op een gouden troon, omringd door engelen, met profeten in nissen onderaan."
              className={styles.image}
            />
            <CimabueOverlays active={active} />
          </div>
          <figcaption className={styles.caption}>
            Cimabue · Maestà di Santa Trinità · ca. 1280 · Uffizi
          </figcaption>
        </figure>

        <figure className={styles.figure}>
          <div className={styles.imageWrap}>
            <img
              src={athensSrc}
              alt="Rafaël, De School van Athene (1509-1511) — filosofen rond Plato en Aristoteles in een mathematisch geconstrueerde hal."
              className={styles.image}
            />
            <AthensOverlays active={active} />
          </div>
          <figcaption className={styles.caption}>
            Rafaël · De School van Athene · 1509–1511 · Stanze di Raffaello
          </figcaption>
        </figure>
      </div>

      <div className={styles.controls}>
        {MARKERS.map((m, idx) => {
          const isOn = active[m.id];
          const className = isOn
            ? `${styles.button} ${styles.buttonActive}`
            : styles.button;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              aria-pressed={isOn}
              className={className}
            >
              <span className={styles.buttonNumber}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className={styles.buttonLabel}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Cimabue overlays ──────────────────────────────────────────────────────

function CimabueOverlays({ active }: { active: ActiveState }) {
  return (
    <>
      <svg
        className={styles.svgOverlay}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
      >
        {active.hierarchie && (
          <g className={styles.fadeIn}>
            {/* Maria — bracket on the left of the figure */}
            <line x1="20" y1="17" x2="20" y2="68" className={styles.bracket} />
            <line x1="20" y1="17" x2="28" y2="17" className={styles.bracket} />
            <line x1="20" y1="68" x2="28" y2="68" className={styles.bracket} />
            {/* Engel — bracket on the far right */}
            <line x1="93" y1="22" x2="93" y2="44" className={styles.bracket} />
            <line x1="86" y1="22" x2="93" y2="22" className={styles.bracket} />
            <line x1="86" y1="44" x2="93" y2="44" className={styles.bracket} />
            {/* Profeet — bracket on the far left, bottom row */}
            <line x1="7" y1="80" x2="7" y2="96" className={styles.bracket} />
            <line x1="7" y1="80" x2="14" y2="80" className={styles.bracket} />
            <line x1="7" y1="96" x2="14" y2="96" className={styles.bracket} />
          </g>
        )}
        {active.achtergrond && (
          <rect
            x="0"
            y="0"
            width="100"
            height="72"
            className={`${styles.highlight} ${styles.fadeIn}`}
          />
        )}
      </svg>

      {active.verdwijnpunt && (
        <div className={`${styles.textLabel} ${styles.labelCimabueVp} ${styles.fadeIn}`}>
          geen verdwijnpunt — de troon vlucht niet
        </div>
      )}
      {active.hierarchie && (
        <div className={`${styles.textLabel} ${styles.labelCimabueHier} ${styles.fadeIn}`}>
          Maria ≈ 3× engel ≈ 5× profeet
        </div>
      )}
      {active.achtergrond && (
        <div className={`${styles.textLabel} ${styles.labelCimabueBg} ${styles.fadeIn}`}>
          goud — geen plek, maar tegenwoordigheid
        </div>
      )}
      {active.ooghoogte && (
        <div className={`${styles.textLabel} ${styles.labelCimabueOog} ${styles.fadeIn}`}>
          geen horizon — Maria zweeft buiten ruimte
        </div>
      )}
    </>
  );
}

// ── Athens overlays ───────────────────────────────────────────────────────
// Vanishing point calibrated at (50, 42) — between Plato and Aristoteles.

function AthensOverlays({ active }: { active: ActiveState }) {
  const VP_X = 50;
  const VP_Y = 42;

  return (
    <>
      <svg
        className={styles.svgOverlay}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
      >
        {active.verdwijnpunt && (
          <g className={styles.fadeIn}>
            {/* Floor + step lines from the bottom edge */}
            <line x1="0" y1="100" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            <line x1="20" y1="100" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            <line x1="40" y1="100" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            <line x1="60" y1="100" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            <line x1="80" y1="100" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            <line x1="100" y1="100" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            {/* Vault / arch lines from the top edge */}
            <line x1="6" y1="6" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            <line x1="94" y1="6" x2={VP_X} y2={VP_Y} className={styles.vpLine} />
            <circle cx={VP_X} cy={VP_Y} r="0.9" className={styles.vpDot} />
          </g>
        )}
        {active.achtergrond && (
          <rect
            x="43"
            y="28"
            width="14"
            height="11"
            className={`${styles.highlight} ${styles.fadeIn}`}
          />
        )}
        {active.ooghoogte && (
          <line
            x1="0"
            y1={VP_Y}
            x2="100"
            y2={VP_Y}
            className={`${styles.horizonLine} ${styles.fadeIn}`}
          />
        )}
      </svg>

      {active.hierarchie && (
        <div className={`${styles.textLabel} ${styles.labelAthensHier} ${styles.fadeIn}`}>
          alle figuren ongeveer gelijke schaal — verschil = afstand, niet rang
        </div>
      )}
      {active.achtergrond && (
        <div className={`${styles.textLabel} ${styles.labelAthensBg} ${styles.fadeIn}`}>
          echte lucht — een buitenwereld die doorloopt
        </div>
      )}
      {active.ooghoogte && (
        <div className={`${styles.textLabel} ${styles.labelAthensOog} ${styles.fadeIn}`}>
          = jouw ooghoogte
        </div>
      )}
    </>
  );
}
