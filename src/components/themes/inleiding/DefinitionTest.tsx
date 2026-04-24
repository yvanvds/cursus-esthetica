import { useState, useMemo } from 'react';
import styles from './DefinitionTest.module.css';

// ── Content ──────────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  figure: string;
  label: string;
  blurb: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'banaan',
    figure: '01',
    label: 'Een banaan met ducttape aan de muur',
    blurb: 'Maurizio Cattelan, Comedian (2019). Verkocht voor 120.000 dollar.',
  },
  {
    id: 'krabbel',
    figure: '02',
    label: 'Een kind dat met stift op een muur krast',
    blurb: 'Spontaan, ongevraagd, zonder publiek. Thuis of op school.',
  },
  {
    id: 'ai-portret',
    figure: '03',
    label: 'Een portret, gegenereerd door AI',
    blurb: 'Een prompt, een algoritme, een beeld dat niemand tekende.',
  },
  {
    id: 'reclame',
    figure: '04',
    label: 'Een reclamespot die je laat huilen',
    blurb: 'Kerstcampagne van een supermarkt. Je voelt iets, maar je weet ook wat ze willen.',
  },
  {
    id: 'sonate',
    figure: '05',
    label: 'Een klassieke sonate van Mozart',
    blurb: 'Uitgevoerd in een concertzaal. Toehoorders in stilte.',
  },
  {
    id: 'meme',
    figure: '06',
    label: 'Een meme die binnen een dag viraal gaat',
    blurb: 'Een beeld, een bijschrift, miljoenen ogen — en dan weg.',
  },
];

type Answer = 'kunst' | 'geen-kunst' | 'twijfel';

interface Profile {
  name: string;
  epithet: string;
  summary: string;
  expects: Record<string, number>;
}

const PROFILES: Record<string, Profile> = {
  plato: {
    name: 'Plato',
    epithet: 'Kunst is imitatie — en eigenlijk een slechte.',
    summary:
      'Voor Plato is kunst een schaduw van een schaduw: een imitatie van de wereld, die zelf al een imitatie is van de echte ideeën. Alleen wat orde, waarheid en harmonie toont, verdient die naam. De rest leidt af.',
    expects: { banaan: 0, krabbel: 0, 'ai-portret': 0.5, reclame: 0, sonate: 1, meme: 0 },
  },
  kant: {
    name: 'Kant',
    epithet: 'Kunst is wat belangeloos behaagt.',
    summary:
      'Voor Kant geniet je van kunst zonder het te willen bezitten, gebruiken of consumeren. Echte esthetische ervaring is vrij van doel. Zodra een werk iets van je wil — overtuigen, verkopen, shockeren — verliest het volgens hem zijn esthetische zuiverheid.',
    expects: { banaan: 0, krabbel: 0.5, 'ai-portret': 0, reclame: 0, sonate: 1, meme: 0 },
  },
  tolstoj: {
    name: 'Tolstoj',
    epithet: 'Kunst draagt emotie over van mens op mens.',
    summary:
      'Voor Tolstoj is kunst een brug: de kunstenaar voelt iets, maakt iets, en jij voelt dat gevoel opnieuw. Wat die overdracht niet tot stand brengt, is geen kunst — hoe technisch briljant het ook mag zijn. Echtheid primeert op raffinement.',
    expects: { banaan: 0.5, krabbel: 1, 'ai-portret': 0, reclame: 1, sonate: 1, meme: 0.5 },
  },
  danto: {
    name: 'Danto',
    epithet: 'Kunst is wat de kunstwereld als kunst erkent.',
    summary:
      'Voor Danto bestaat kunst niet buiten haar instituties. Een banaan op een muur wordt pas kunst wanneer een galerie, een criticus, een verzamelaar haar zo benoemt. Dat klinkt cynisch, maar het verklaart wél waarom dezelfde banaan op je aanrecht iets anders is.',
    expects: { banaan: 1, krabbel: 0, 'ai-portret': 1, reclame: 0.5, sonate: 1, meme: 0.5 },
  },
};

// ── Matching logic ───────────────────────────────────────────────────────

const ANSWER_VALUES: Record<Answer, number> = {
  kunst: 1,
  'geen-kunst': 0,
  twijfel: 0.5,
};

function scoreProfile(answers: Record<string, Answer>, profile: Profile): number {
  let sum = 0;
  for (const s of SCENARIOS) {
    const user = ANSWER_VALUES[answers[s.id]];
    const expected = profile.expects[s.id];
    sum += 1 - Math.abs(user - expected);
  }
  return sum / SCENARIOS.length;
}

function perScenarioAgreement(answers: Record<string, Answer>, profile: Profile) {
  return SCENARIOS.map((s) => {
    const user = ANSWER_VALUES[answers[s.id]];
    const expected = profile.expects[s.id];
    return {
      scenario: s,
      agreement: 1 - Math.abs(user - expected),
      userAnswer: answers[s.id],
      expectedAnswer:
        expected === 1 ? ('kunst' as const) : expected === 0 ? ('geen-kunst' as const) : ('twijfel' as const),
    };
  });
}

// ── Choice button ────────────────────────────────────────────────────────

interface ChoiceButtonProps {
  value: Answer;
  label: string;
  selected: boolean;
  onClick: (v: Answer) => void;
}

function ChoiceButton({ value, label, selected, onClick }: ChoiceButtonProps) {
  const className = selected ? `${styles.choice} ${styles.choiceSelected}` : styles.choice;
  return (
    <button type="button" onClick={() => onClick(value)} className={className}>
      {label}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────

export default function DefinitionTest() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = SCENARIOS.every((s) => answers[s.id]);
  const answeredCount = Object.keys(answers).length;

  const results = useMemo(() => {
    if (!submitted) return null;
    const scored = Object.entries(PROFILES).map(([key, profile]) => ({
      key,
      profile,
      score: scoreProfile(answers, profile),
    }));
    scored.sort((a, b) => b.score - a.score);
    return {
      closest: scored[0],
      furthest: scored[scored.length - 1],
      all: scored,
    };
  }, [answers, submitted]);

  const setAnswer = (scenarioId: string, value: Answer) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [scenarioId]: value }));
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  // ── Results view ───────────────────────────────────────────────────────
  if (submitted && results) {
    const furthestAgreements = perScenarioAgreement(answers, results.furthest.profile);
    const biggestClashes = [...furthestAgreements]
      .sort((a, b) => a.agreement - b.agreement)
      .slice(0, 3);

    return (
      <div className={styles.root}>
        <div className={styles.headerResult}>
          <p className={styles.label}>— resultaat</p>
          <h3 className={styles.heading}>
            Je denkt het meest als <em className={styles.accent}>{results.closest.profile.name}</em>.
          </h3>
          <p className={styles.epithet}>"{results.closest.profile.epithet}"</p>
        </div>

        <div className={styles.summaryBlock}>
          <p className={styles.summary}>{results.closest.profile.summary}</p>
        </div>

        <div className={styles.clashSection}>
          <p className={styles.label}>— grootste botsing</p>
          <h4 className={styles.subheading}>
            Je antwoorden botsen het hardst met{' '}
            <em className={styles.italic}>{results.furthest.profile.name}</em>.
          </h4>
          <p className={styles.summaryDim}>{results.furthest.profile.summary}</p>

          <div className={styles.clashList}>
            {biggestClashes.map(({ scenario, userAnswer, expectedAnswer }) => (
              <div key={scenario.id} className={styles.clashRow}>
                <span className={styles.figure}>{scenario.figure}</span>
                <span className={styles.clashLabel}>{scenario.label}</span>
                <span className={styles.clashMeta}>
                  jij:{' '}
                  <span className={styles.clashMetaValue}>{userAnswer.replace('-', ' ')}</span>
                  {'  '}·{'  '}
                  {results.furthest.profile.name.toLowerCase()}:{' '}
                  <span className={styles.clashMetaValue}>{expectedAnswer.replace('-', ' ')}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rankings}>
          <p className={styles.label}>— alle posities</p>
          {results.all.map(({ key, profile, score }, idx) => {
            const isTop = idx === 0;
            return (
              <div key={key} className={styles.rankingRow}>
                <span className={`${styles.rank} ${isTop ? styles.rankTop : ''}`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className={styles.rankBody}>
                  <span className={`${styles.rankName} ${isTop ? styles.rankNameTop : ''}`}>
                    {profile.name}
                  </span>
                  <div className={styles.rankBar}>
                    <div
                      className={`${styles.rankBarFill} ${isTop ? styles.rankBarFillTop : ''}`}
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
                <span className={`${styles.rankScore} ${isTop ? styles.rankScoreTop : ''}`}>
                  {Math.round(score * 100)}%
                </span>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={reset} className={styles.reset}>
          opnieuw invullen →
        </button>
      </div>
    );
  }

  // ── Quiz view ──────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.label}>— oefening · zes scenario's</p>
        <h3 className={styles.heading}>
          Is dit <em className={styles.accent}>kunst</em>?
        </h3>
        <p className={styles.intro}>
          Kies per scenario wat jouw intuïtie zegt. Geen goed of fout — aan het einde zie je
          welke filosoof het dichtst bij jouw manier van kijken staat, en welke botst met wat
          jij denkt.
        </p>
      </div>

      <div className={styles.scenarioList}>
        {SCENARIOS.map((s) => (
          <div
            key={s.id}
            className={`${styles.scenario} ${answers[s.id] ? styles.scenarioAnswered : ''}`}
          >
            <div className={styles.scenarioHeader}>
              <span className={styles.figure}>{s.figure}</span>
              <div className={styles.scenarioText}>
                <p className={styles.scenarioLabel}>{s.label}</p>
                <p className={styles.scenarioBlurb}>{s.blurb}</p>
              </div>
            </div>
            <div className={styles.choices}>
              <ChoiceButton
                value="kunst"
                label="kunst"
                selected={answers[s.id] === 'kunst'}
                onClick={(v) => setAnswer(s.id, v)}
              />
              <ChoiceButton
                value="twijfel"
                label="twijfel"
                selected={answers[s.id] === 'twijfel'}
                onClick={(v) => setAnswer(s.id, v)}
              />
              <ChoiceButton
                value="geen-kunst"
                label="geen kunst"
                selected={answers[s.id] === 'geen-kunst'}
                onClick={(v) => setAnswer(s.id, v)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.progress}>
          {answeredCount} / {SCENARIOS.length} beantwoord
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className={`${styles.submit} ${allAnswered ? styles.submitReady : ''}`}
        >
          toon resultaat →
        </button>
      </div>
    </div>
  );
}