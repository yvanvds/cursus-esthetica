import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './DebatApp.module.css';
import {
  SIDES,
  SIDE_LABEL,
  STATEMENTS,
  STEPS,
  STORAGE_KEY,
  anyRunning,
  buildCsv,
  countdown,
  csvFilename,
  currentDebate,
  deserialize,
  elapsedMs,
  formatDecimal,
  formatSeconds,
  formatSigned,
  initialState,
  isPlayable,
  isRunning,
  isTimedStep,
  membersOf,
  reducer,
  serialize,
  timingOf,
  voteShift,
} from './debat-logic';
import type { Action, AppState, Debate, Side, StepDef, Team, Votes } from './debat-logic';

// The teacher's tool for the debate of chapter 17 (#117). Rendered with
// `client:only`: everything here depends on localStorage and the clock, so
// there is nothing meaningful to render on the server.

interface Props {
  readonly chapterHref: string;
}

type Dispatch = (action: Action) => void;

// ---- storage ---------------------------------------------------------------

function loadState(): AppState {
  try {
    return deserialize(window.localStorage.getItem(STORAGE_KEY)) ?? initialState();
  } catch {
    return initialState();
  }
}

function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(state, performance.now()));
  } catch {
    // Private window, full or blocked storage: the app keeps working in memory.
  }
}

// ---- sound -----------------------------------------------------------------

/**
 * A short double beep through WebAudio. Browsers only let an AudioContext
 * play after a user gesture, so `unlock` runs on every key and pointer press.
 */
function useBeep() {
  const contextRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    try {
      contextRef.current ??= new AudioContext();
      if (contextRef.current.state === 'suspended') void contextRef.current.resume();
    } catch {
      // No WebAudio: the visual signal remains.
    }
  }, []);

  const beep = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    try {
      const start = context.currentTime;
      for (const offset of [0, 0.32]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.5, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.26);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + 0.28);
      }
    } catch {
      // Ignore: sound is a courtesy.
    }
  }, []);

  return { unlock, beep };
}

// ---- helpers ---------------------------------------------------------------

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function displaySigned(value: number, digits = 1): string {
  return formatSigned(value, digits).replace('-', '−');
}

function percent(share: number | null): string {
  return share === null ? '—' : `${formatDecimal(share * 100, 0)} %`;
}

/** Second line of a step in the overview: side and time, or who votes. */
function stepSummary(step: StepDef): string {
  if (step.seconds === null) return step.who;
  const total = step.kind === 'free-round' ? step.seconds * 2 : step.seconds;
  return step.side ? `${SIDE_LABEL[step.side]} · ${formatSeconds(total)}` : formatSeconds(total);
}

function teamLine(team: Team, side: Side): string {
  const names = membersOf(team, side).map((member) => member.name);
  return names.length > 0 ? names.join(', ') : '—';
}

function downloadCsv(state: AppState): void {
  const blob = new Blob([buildCsv(state, performance.now())], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = csvFilename(new Date());
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Timers on screen right now, for the signal at 0. */
function visibleClocks(state: AppState, now: number): { key: string; planned: number; elapsed: number }[] {
  const open = currentDebate(state);
  if (!open) return [];
  const { index, debate, step } = open;
  if (isTimedStep(step)) {
    return [{ key: `${index}:${step.id}`, planned: step.seconds ?? 0, elapsed: elapsedMs(debate.timed[step.id].timer, now) }];
  }
  if (step.kind === 'free-round') {
    return SIDES.map((side) => ({
      key: `${index}:${step.id}:${side}`,
      planned: step.seconds ?? 0,
      elapsed: elapsedMs(debate.freeRound.clocks[side], now),
    }));
  }
  return [];
}

// ---- app -------------------------------------------------------------------

export default function DebatApp({ chapterHref }: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [, setTick] = useState(0);
  const [flash, setFlash] = useState(0);
  const stateRef = useRef(state);
  const overRef = useRef(new Map<string, boolean>());
  const { unlock, beep } = useBeep();
  const running = anyRunning(state);

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  // Re-render while a clock runs. The interval only triggers a render; the
  // time shown is always computed from timestamps. Every second the running
  // state is also written away, in case the tab is killed without `pagehide`.
  useEffect(() => {
    if (!running) return;
    let ticks = 0;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      ticks += 1;
      if (ticks % 5 === 0) saveState(stateRef.current);
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    const save = () => saveState(stateRef.current);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Keyboard and presenter: → / PageDown, ← / PageUp, space.
  useEffect(() => {
    const ignored = (event: KeyboardEvent) =>
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isEditable(event.target);

    const onKeyDown = (event: KeyboardEvent) => {
      unlock();
      if (ignored(event) || stateRef.current.screen !== 'debate') return;
      const now = performance.now();
      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          if (!event.repeat) dispatch({ type: 'next-step', now });
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          if (!event.repeat) dispatch({ type: 'previous-step', now });
          break;
        case ' ':
          // preventDefault on keydown also keeps a focused button from being
          // clicked by the same space press: one press, one action.
          event.preventDefault();
          if (!event.repeat) dispatch({ type: 'toggle-timer', now });
          break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ' && !ignored(event) && stateRef.current.screen === 'debate') event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('pointerdown', unlock, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('pointerdown', unlock, true);
    };
  }, [unlock]);

  // Signal when a clock reaches 0: only on the crossing itself, never when a
  // step that is already over time comes back on screen.
  useEffect(() => {
    let crossed = false;
    for (const clock of visibleClocks(state, performance.now())) {
      const over = clock.elapsed >= clock.planned * 1000;
      const before = overRef.current.get(clock.key);
      if (before === false && over) crossed = true;
      overRef.current.set(clock.key, over);
    }
    if (crossed) {
      setFlash((n) => n + 1);
      if (!state.muted) beep();
    }
  });

  const toggleMute = () => {
    if (state.muted) {
      unlock();
      beep();
    }
    dispatch({ type: 'toggle-mute' });
  };

  const open = currentDebate(state);

  return (
    <div className={styles.app}>
      {flash > 0 && <div key={flash} className={styles.flash} aria-hidden="true" />}
      <header className={styles.bar}>
        <p className={styles.brand}>Debat · graffiti</p>
        <nav className={styles.barNav} aria-label="Debat-app">
          {open && (
            <button type="button" className={styles.barButton} onClick={() => dispatch({ type: 'leave-debate', now: performance.now() })}>
              ← Stellingen
            </button>
          )}
          <button type="button" className={styles.barButton} onClick={toggleMute} aria-pressed={!state.muted}>
            {state.muted ? 'Geluid uit' : 'Geluid aan'}
          </button>
          <a className={styles.barButton} href={chapterHref}>
            Naar het hoofdstuk
          </a>
        </nav>
      </header>

      {open ? (
        <DebateScreen index={open.index} debate={open.debate} step={open.step} team={state.teams[open.index]} dispatch={dispatch} />
      ) : state.screen === 'choose' ? (
        <ChooseScreen state={state} dispatch={dispatch} />
      ) : (
        <TeamsScreen state={state} dispatch={dispatch} />
      )}
    </div>
  );
}

// ---- shared ----------------------------------------------------------------

function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={styles.quiet} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className={styles.confirm} role="group" aria-label={label}>
      <span className={styles.confirmText}>{question}</span>
      <button
        type="button"
        className={styles.danger}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className={styles.quiet} onClick={() => setAsking(false)}>
        Annuleren
      </button>
    </span>
  );
}

// ---- teams -----------------------------------------------------------------

function TeamsScreen({ state, dispatch }: { state: AppState; dispatch: Dispatch }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Teams</h1>
      <p className={styles.lead}>
        Vul per stelling twee of drie namen in voor elke kant. Een stelling zonder twee teams kun je niet kiezen.
      </p>
      <ol className={styles.teamList}>
        {STATEMENTS.map((text, index) => {
          const team = state.teams[index];
          const playable = isPlayable(team);
          return (
            <li key={text} className={styles.teamCard}>
              <p className={styles.kicker}>Stelling {index + 1}</p>
              <p className={styles.cardStatement}>{text}</p>
              <div className={styles.sides}>
                {SIDES.map((side) => (
                  <fieldset key={side} className={styles.sideFields}>
                    <legend className={styles.sideLegend}>{SIDE_LABEL[side]}</legend>
                    {team[side].map((name, slot) => (
                      <input
                        key={slot}
                        type="text"
                        className={styles.nameInput}
                        value={name}
                        maxLength={40}
                        autoComplete="off"
                        placeholder={slot < 2 ? `naam ${slot + 1}` : 'naam 3 (mag leeg)'}
                        aria-label={`Stelling ${index + 1}, ${SIDE_LABEL[side]}, naam ${slot + 1}`}
                        onChange={(event) =>
                          dispatch({ type: 'set-name', statement: index, side, slot, name: event.target.value })
                        }
                      />
                    ))}
                  </fieldset>
                ))}
              </div>
              <p className={playable ? styles.statusReady : styles.status}>
                {playable ? '✓ twee teams' : 'nog geen twee teams'}
              </p>
            </li>
          );
        })}
      </ol>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => dispatch({ type: 'show', screen: 'choose' })}>
          Naar de stellingen →
        </button>
      </div>
    </main>
  );
}

// ---- choose ----------------------------------------------------------------

function ChooseScreen({ state, dispatch }: { state: AppState; dispatch: Dispatch }) {
  const hasResults = state.debates.some((debate) => debate !== null);
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Kies een stelling</h1>
      <ol className={styles.choiceList}>
        {STATEMENTS.map((text, index) => {
          const team = state.teams[index];
          const debate = state.debates[index];
          const playable = isPlayable(team);
          const status = debate?.done
            ? '✓ afgewerkt'
            : debate
              ? `bezig · ${STEPS[debate.step].label.toLowerCase()}`
              : playable
                ? 'klaar om te beginnen'
                : 'teams ontbreken';
          return (
            <li key={text}>
              <button
                type="button"
                className={`${styles.choice} ${debate?.done ? styles.choiceDone : ''}`}
                disabled={!playable}
                onClick={() => dispatch({ type: 'open-debate', statement: index, now: performance.now() })}
              >
                <span className={styles.choiceNr}>{index + 1}</span>
                <span className={styles.choiceBody}>
                  <span className={styles.choiceText}>{text}</span>
                  <span className={styles.choiceTeams}>
                    VOOR: {teamLine(team, 'voor')} · TEGEN: {teamLine(team, 'tegen')}
                  </span>
                </span>
                <span className={styles.choiceStatus}>{status}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={styles.tools}>
        <button type="button" className={styles.secondary} onClick={() => dispatch({ type: 'show', screen: 'teams' })}>
          Teams aanpassen
        </button>
        <button type="button" className={styles.secondary} disabled={!hasResults} onClick={() => downloadCsv(state)}>
          Resultaten downloaden (CSV)
        </button>
        <ConfirmButton
          label="Alles wissen…"
          question="Alle teams, tijden en stemmen worden gewist. Download eerst de resultaten als je ze nog nodig hebt."
          confirmLabel="Ja, alles wissen"
          onConfirm={() => dispatch({ type: 'reset-all' })}
        />
      </div>
    </main>
  );
}

// ---- debate ----------------------------------------------------------------

interface DebateProps {
  index: number;
  debate: Debate;
  step: StepDef;
  team: Team;
  dispatch: Dispatch;
}

function DebateScreen({ index, debate, step, team, dispatch }: DebateProps) {
  const now = performance.now();
  const hasTimer = isTimedStep(step) || step.kind === 'free-round';
  const timerRuns = isTimedStep(step)
    ? isRunning(debate.timed[step.id].timer)
    : step.kind === 'free-round' && debate.freeRound.active !== null;
  const isLast = debate.step === STEPS.length - 1;

  let panel: ReactNode;
  if (step.kind === 'vote-before' || step.kind === 'vote-after') {
    panel = <VotePanel debate={debate} step={step} dispatch={dispatch} />;
  } else if (step.kind === 'free-round') {
    panel = <FreeRoundPanel debate={debate} step={step} team={team} now={now} dispatch={dispatch} />;
  } else {
    panel = <TimedPanel debate={debate} step={step} team={team} now={now} dispatch={dispatch} />;
  }

  return (
    <main className={styles.debate}>
      <header className={styles.statementHead}>
        <p className={styles.kicker}>
          Stelling {index + 1} · stap {debate.step + 1} van {STEPS.length}
        </p>
        <h1 className={styles.statement}>{STATEMENTS[index]}</h1>
      </header>

      <ol className={styles.steps} aria-label="Verloop">
        {STEPS.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              className={`${styles.stepPill} ${i === debate.step ? styles.stepCurrent : i < debate.step ? styles.stepPast : ''}`}
              aria-current={i === debate.step ? 'step' : undefined}
              onClick={() => dispatch({ type: 'go-to-step', step: i, now: performance.now() })}
            >
              <span className={styles.stepLabel}>{item.label}</span>
              <span className={styles.stepWho}>{stepSummary(item)}</span>
            </button>
          </li>
        ))}
      </ol>

      <section className={styles.stage}>{panel}</section>

      <div className={styles.bottom}>
        <footer className={styles.controls}>
          <button
            type="button"
            className={styles.secondary}
            disabled={debate.step === 0}
            onClick={() => dispatch({ type: 'previous-step', now: performance.now() })}
          >
            ← Vorige
          </button>
          {hasTimer && (
            <button
              type="button"
              className={styles.primary}
              onClick={() => dispatch({ type: 'toggle-timer', now: performance.now() })}
            >
              {timerRuns ? 'Pauze' : 'Start'}
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() => dispatch({ type: 'finish-debate', now: performance.now() })}
            >
              Volgend debat →
            </button>
          ) : (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => dispatch({ type: 'next-step', now: performance.now() })}
            >
              Volgende →
            </button>
          )}
        </footer>
        <p className={styles.hint}>→ of PageDown: volgende · ← of PageUp: vorige · spatie: start of pauze</p>
        <div className={styles.bottomEnd}>
          <ConfirmButton
            label="Stap wissen"
            question="Tijd, sprekers of stemmen van deze stap wissen?"
            confirmLabel="Ja, wissen"
            onConfirm={() => dispatch({ type: 'clear-step' })}
          />
        </div>
      </div>
    </main>
  );
}

function StepTitle({ step, detail }: { step: StepDef; detail: string }) {
  return (
    <h2 className={styles.stepTitle}>
      {step.label} <span className={styles.stepTitleWho}>{detail}</span>
    </h2>
  );
}

function TimedPanel({ debate, step, team, now, dispatch }: { debate: Debate; step: StepDef; team: Team; now: number; dispatch: Dispatch }) {
  const record = debate.timed[step.id];
  const planned = step.seconds ?? 0;
  const elapsed = elapsedMs(record.timer, now);
  const clock = countdown(planned, elapsed);
  const runs = isRunning(record.timer);
  const side = step.kind === 'speech' ? step.side : null;
  const members = side ? membersOf(team, side) : [];
  const nameOf = (slot: number) => members.find((member) => member.slot === slot)?.name ?? '?';

  let note = `van ${formatSeconds(planned)}`;
  if (clock.over) note = 'overtijd';
  else if (!runs && elapsed > 0) note = `van ${formatSeconds(planned)} · gepauzeerd`;

  return (
    <>
      <StepTitle step={step} detail={step.who} />
      <p className={`${styles.clock} ${clock.over ? styles.over : ''}`}>{clock.text}</p>
      <p className={clock.over ? styles.clockNoteOver : styles.clockNote}>{note}</p>
      {side && (
        <>
          <p className={styles.speaking}>
            {record.current !== null ? (
              <>
                Aan het woord: <strong className={styles.speakerName}>{nameOf(record.current)}</strong>
              </>
            ) : (
              'Tik op wie spreekt.'
            )}
          </p>
          <div className={styles.names}>
            {members.map((member) => (
              <button
                key={member.slot}
                type="button"
                className={`${styles.nameButton} ${record.current === member.slot ? styles.nameCurrent : record.speakers.includes(member.slot) ? styles.nameDone : ''}`}
                onClick={() => dispatch({ type: 'tap-speaker', side, slot: member.slot, now: performance.now() })}
              >
                {member.name}
              </button>
            ))}
          </div>
          {record.speakers.length > 0 && (
            <p className={styles.registered}>
              Sprekers deze beurt:{' '}
              {record.speakers.map((slot) => (
                <span key={slot} className={styles.registeredName}>
                  {nameOf(slot)}
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`${nameOf(slot)} schrappen`}
                    onClick={() => dispatch({ type: 'remove-speaker', slot })}
                  >
                    ×
                  </button>
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </>
  );
}

function FreeRoundPanel({ debate, step, team, now, dispatch }: { debate: Debate; step: StepDef; team: Team; now: number; dispatch: Dispatch }) {
  const round = debate.freeRound;
  const planned = step.seconds ?? 0;
  const current = round.current;
  const currentName = current ? membersOf(team, current.side).find((m) => m.slot === current.slot)?.name ?? '?' : null;

  return (
    <>
      <StepTitle step={step} detail={`schaakklok 2 × ${formatSeconds(planned)}`} />
      <p className={styles.speaking}>
        {current && currentName ? (
          <>
            Aan het woord: <strong className={styles.speakerName}>{currentName}</strong> ({SIDE_LABEL[current.side]})
            {round.active === null && ' · gepauzeerd'}
          </>
        ) : (
          'Tik een naam: de klok van dat team loopt.'
        )}
      </p>
      <div className={styles.chess}>
        {SIDES.map((side) => {
          const elapsed = elapsedMs(round.clocks[side], now);
          const clock = countdown(planned, elapsed);
          const used = timingOf(planned, elapsed).used;
          return (
            <div key={side} className={`${styles.chessSide} ${round.active === side ? styles.chessActive : ''}`}>
              <p className={styles.chessLabel}>{SIDE_LABEL[side]}</p>
              <p className={`${styles.chessClock} ${clock.over ? styles.over : ''}`}>{clock.text}</p>
              <p className={styles.chessMeta}>
                {round.teamTurns[side]} {round.teamTurns[side] === 1 ? 'beurt' : 'beurten'} · {formatSeconds(used)} gebruikt
              </p>
              <div className={styles.chessNames}>
                {membersOf(team, side).map((member) => {
                  const turns = round.speakerTurns[side][member.slot];
                  const isCurrent = current?.side === side && current.slot === member.slot;
                  return (
                    <span key={member.slot} className={styles.chessName}>
                      <button
                        type="button"
                        className={`${styles.nameButton} ${isCurrent ? styles.nameCurrent : turns > 0 ? styles.nameDone : ''}`}
                        onClick={() => dispatch({ type: 'tap-speaker', side, slot: member.slot, now: performance.now() })}
                      >
                        {member.name}
                      </button>
                      <span className={styles.turnCount}>{turns}×</span>
                      <button
                        type="button"
                        className={styles.remove}
                        aria-label={`Eén beurt minder voor ${member.name}`}
                        disabled={turns === 0}
                        onClick={() => dispatch({ type: 'adjust-free-turns', side, slot: member.slot, delta: -1 })}
                      >
                        −
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function VotePanel({ debate, step, dispatch }: { debate: Debate; step: StepDef; dispatch: Dispatch }) {
  const when = step.kind === 'vote-before' ? 'before' : 'after';
  const votes: Votes = when === 'before' ? debate.votesBefore : debate.votesAfter;
  const total = votes.voor + votes.tegen;
  const set = (side: Side, value: number) => dispatch({ type: 'set-votes', when, side, value });
  const shift = voteShift(debate.votesBefore, debate.votesAfter);

  return (
    <>
      <StepTitle step={step} detail="publiek" />
      <p className={styles.votePrompt}>Wie is het eens met de stelling? Tel de handen.</p>
      <div className={styles.votes}>
        {SIDES.map((side) => (
          <div key={side} className={styles.voteBox}>
            <p className={styles.chessLabel}>{SIDE_LABEL[side]}</p>
            <div className={styles.voteRow}>
              <button
                type="button"
                className={styles.voteStep}
                aria-label={`${SIDE_LABEL[side]} min één`}
                onClick={() => set(side, votes[side] - 1)}
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                className={styles.voteInput}
                value={String(votes[side])}
                aria-label={`Stemmen ${SIDE_LABEL[side]}`}
                onFocus={(event) => event.target.select()}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '');
                  set(side, digits === '' ? 0 : Number(digits));
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
              />
              <button
                type="button"
                className={styles.voteStep}
                aria-label={`${SIDE_LABEL[side]} plus één`}
                onClick={() => set(side, votes[side] + 1)}
              >
                +
              </button>
            </div>
            <p className={styles.voteShare}>{total > 0 ? percent(votes[side] / total) : '—'}</p>
          </div>
        ))}
      </div>
      {when === 'after' && (
        <div className={styles.shift}>
          <p className={styles.shiftLine}>
            Vooraf {debate.votesBefore.voor} VOOR · {debate.votesBefore.tegen} TEGEN ({percent(shift.shareBefore)} VOOR) — achteraf{' '}
            {debate.votesAfter.voor} VOOR · {debate.votesAfter.tegen} TEGEN ({percent(shift.shareAfter)} VOOR)
          </p>
          <p className={styles.shiftResult}>
            Verschuiving naar VOOR:{' '}
            <strong>{shift.pp === null ? '—' : `${displaySigned(shift.pp)} procentpunten`}</strong>
            <span className={styles.shiftAbsolute}>
              {' '}
              ({displaySigned(shift.absolute, 0)} {Math.abs(shift.absolute) === 1 ? 'stem' : 'stemmen'})
            </span>
          </p>
          {shift.pp === null && <p className={styles.clockNote}>Zonder stemmen vooraf én achteraf valt er geen verschuiving te berekenen.</p>}
        </div>
      )}
    </>
  );
}
