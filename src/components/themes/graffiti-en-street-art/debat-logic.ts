// Pure logic for the graffiti debate app (#117): step list, state reducer,
// timer arithmetic, chess clock, vote shift and CSV export. No React and no
// DOM here, so the whole debate can be replayed in node with a fake clock.
//
// Every time value that enters the reducer comes in as `now` (milliseconds on
// a monotonic clock, `performance.now()` in the browser). Timers store a
// timestamp, never a tick count: a throttled background tab or a slow
// projector laptop cannot make a timer lose time.
//
// Those timestamps only mean something within one page load. `freeze()`
// therefore turns every running timer into a paused one before the state is
// written to storage; a reload restores all timers paused at their elapsed
// time.

export type Side = 'voor' | 'tegen';

export const SIDES: readonly Side[] = ['voor', 'tegen'];

export const SIDE_LABEL: Readonly<Record<Side, string>> = {
  voor: 'VOOR',
  tegen: 'TEGEN',
};

/** Verbatim from the assignment sheet (Debat_graffiti.docx). */
export const STATEMENTS: readonly string[] = [
  'Graffiti verliest haar betekenis zodra ze wordt toegestaan of gesubsidieerd.',
  'Wie zonder toestemming een muur beschildert, eist terecht de publieke ruimte op.',
  'Bedrijven die graffiti-esthetiek gebruiken, hollen haar betekenis uit.',
  'Een tag is evengoed kunst als een grote muurschildering.',
  'Een graffitiwerk hoort toe aan de maker, niet aan de eigenaar van de muur.',
];

/** Name slots per side. A team has two or three members. */
export const TEAM_SLOTS = 3;
export const MIN_TEAM_SIZE = 2;

export type StepKind = 'vote-before' | 'speech' | 'consult' | 'free-round' | 'vote-after';

export interface StepDef {
  readonly id: string;
  readonly kind: StepKind;
  readonly label: string;
  /**
   * Planned seconds. For the free round this is the time on *each* team's
   * clock (2 × 1:30 = 3:00). `null` for the votes, which have no timer.
   */
  readonly seconds: number | null;
  /** The side that speaks; `null` for steps that belong to both or neither. */
  readonly side: Side | null;
  readonly who: string;
}

/**
 * The debate format, in order. This is the one place where the format lives:
 * change the assignment sheet, change this list. The closing statements run
 * TEGEN before VOOR, as on the sheet.
 */
export const STEPS: readonly StepDef[] = [
  { id: 'stemming-vooraf', kind: 'vote-before', label: 'Stemming vooraf', seconds: null, side: null, who: 'publiek' },
  { id: 'opening-voor', kind: 'speech', label: 'Opening', seconds: 60, side: 'voor', who: 'VOOR' },
  { id: 'opening-tegen', kind: 'speech', label: 'Opening', seconds: 60, side: 'tegen', who: 'TEGEN' },
  { id: 'overleg', kind: 'consult', label: 'Kort overleg', seconds: 60, side: null, who: 'beide teams' },
  { id: 'weerlegging-voor', kind: 'speech', label: 'Weerlegging', seconds: 90, side: 'voor', who: 'VOOR' },
  { id: 'weerlegging-tegen', kind: 'speech', label: 'Weerlegging', seconds: 90, side: 'tegen', who: 'TEGEN' },
  { id: 'vrije-ronde', kind: 'free-round', label: 'Vrije ronde', seconds: 90, side: null, who: 'om beurten' },
  { id: 'slotwoord-tegen', kind: 'speech', label: 'Slotwoord', seconds: 30, side: 'tegen', who: 'TEGEN' },
  { id: 'slotwoord-voor', kind: 'speech', label: 'Slotwoord', seconds: 30, side: 'voor', who: 'VOOR' },
  { id: 'stemming-achteraf', kind: 'vote-after', label: 'Stemming achteraf', seconds: null, side: null, who: 'publiek' },
];

/** Steps with a single timer: the speeches and the consultation. */
export function isTimedStep(step: StepDef): boolean {
  return step.kind === 'speech' || step.kind === 'consult';
}

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

export interface Timer {
  /** Time accumulated in earlier running stretches. */
  readonly accMs: number;
  /** Start of the current running stretch, or `null` when paused. */
  readonly since: number | null;
}

export const IDLE_TIMER: Timer = { accMs: 0, since: null };

export function elapsedMs(timer: Timer, now: number): number {
  return timer.since === null ? timer.accMs : timer.accMs + Math.max(0, now - timer.since);
}

export function isRunning(timer: Timer): boolean {
  return timer.since !== null;
}

export function startTimer(timer: Timer, now: number): Timer {
  return timer.since === null ? { accMs: timer.accMs, since: now } : timer;
}

export function pauseTimer(timer: Timer, now: number): Timer {
  return timer.since === null ? timer : { accMs: elapsedMs(timer, now), since: null };
}

/** Display state of a countdown: time left, or time over once it hits 0. */
export interface Countdown {
  readonly over: boolean;
  readonly text: string;
}

export function countdown(plannedSeconds: number, elapsed: number): Countdown {
  const leftMs = plannedSeconds * 1000 - elapsed;
  if (leftMs > 0) {
    // Ceil while counting down, so "0:00" is shown exactly when time is up.
    return { over: false, text: formatSeconds(Math.ceil(leftMs / 1000)) };
  }
  return { over: true, text: `+${formatSeconds(Math.floor(-leftMs / 1000))}` };
}

export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** What gets recorded for a timed turn, in whole seconds. */
export interface Timing {
  readonly planned: number;
  readonly used: number;
  /** The team stopped early: planned − used. 0 when on or over time. */
  readonly rest: number;
  /** The team ran over: used − planned. 0 when on or under time. */
  readonly overtime: number;
}

export function timingOf(plannedSeconds: number, elapsed: number): Timing {
  // Rounded once, and rest/overtime derived from that integer, so that
  // used = planned − rest + overtime always holds in the export.
  const used = Math.round(elapsed / 1000);
  return {
    planned: plannedSeconds,
    used,
    rest: Math.max(0, plannedSeconds - used),
    overtime: Math.max(0, used - plannedSeconds),
  };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Three name slots per side; an empty string is an unused slot. */
export type Team = Readonly<Record<Side, readonly string[]>>;

/** A speech or the consultation: one timer, the speakers registered. */
export interface TimedRecord {
  readonly timer: Timer;
  /** Slots (on the step's side) that spoke in this turn, in order of first tap. */
  readonly speakers: readonly number[];
  /** Slot that has the floor now. */
  readonly current: number | null;
}

export interface Speaker {
  readonly side: Side;
  readonly slot: number;
}

/** The free round: a chess clock with one clock per team. */
export interface FreeRound {
  readonly clocks: Readonly<Record<Side, Timer>>;
  /** Side whose clock runs now; `null` when both stand still. */
  readonly active: Side | null;
  /** Side whose clock ran last; a resume continues there. */
  readonly lastSide: Side | null;
  readonly current: Speaker | null;
  /** How many times the clock switched to this team. */
  readonly teamTurns: Readonly<Record<Side, number>>;
  /** Taps per name, indexed by slot. */
  readonly speakerTurns: Readonly<Record<Side, readonly number[]>>;
}

export interface Votes {
  readonly voor: number;
  readonly tegen: number;
}

export interface Debate {
  readonly step: number;
  /** Keyed by step id, for every step for which `isTimedStep` holds. */
  readonly timed: Readonly<Record<string, TimedRecord>>;
  readonly freeRound: FreeRound;
  readonly votesBefore: Votes;
  readonly votesAfter: Votes;
  readonly done: boolean;
}

export type Screen = 'teams' | 'choose' | 'debate';

export interface AppState {
  readonly version: 1;
  readonly screen: Screen;
  /** One per statement. */
  readonly teams: readonly Team[];
  /** One per statement; `null` until the debate is first opened. */
  readonly debates: readonly (Debate | null)[];
  /** Statement index of the open debate. */
  readonly current: number | null;
  readonly muted: boolean;
}

function emptySlots<T>(value: T): T[] {
  return Array.from({ length: TEAM_SLOTS }, () => value);
}

export function emptyTeam(): Team {
  return { voor: emptySlots(''), tegen: emptySlots('') };
}

const NO_VOTES: Votes = { voor: 0, tegen: 0 };

export function newFreeRound(): FreeRound {
  return {
    clocks: { voor: IDLE_TIMER, tegen: IDLE_TIMER },
    active: null,
    lastSide: null,
    current: null,
    teamTurns: { voor: 0, tegen: 0 },
    speakerTurns: { voor: emptySlots(0), tegen: emptySlots(0) },
  };
}

function newTimedRecord(): TimedRecord {
  return { timer: IDLE_TIMER, speakers: [], current: null };
}

export function newDebate(): Debate {
  const timed: Record<string, TimedRecord> = {};
  for (const step of STEPS) {
    if (isTimedStep(step)) timed[step.id] = newTimedRecord();
  }
  return {
    step: 0,
    timed,
    freeRound: newFreeRound(),
    votesBefore: NO_VOTES,
    votesAfter: NO_VOTES,
    done: false,
  };
}

export function initialState(): AppState {
  return {
    version: 1,
    screen: 'teams',
    teams: STATEMENTS.map(() => emptyTeam()),
    debates: STATEMENTS.map(() => null),
    current: null,
    muted: false,
  };
}

/** The filled-in names of one side, with their slot. */
export function membersOf(team: Team, side: Side): { slot: number; name: string }[] {
  return team[side]
    .map((raw, slot) => ({ slot, name: raw.trim() }))
    .filter((member) => member.name !== '');
}

export function isPlayable(team: Team): boolean {
  return SIDES.every((side) => membersOf(team, side).length >= MIN_TEAM_SIZE);
}

// ---------------------------------------------------------------------------
// Pausing and freezing
// ---------------------------------------------------------------------------

function pauseFreeRound(round: FreeRound, now: number): FreeRound {
  if (round.active === null) return round;
  return {
    ...round,
    clocks: { ...round.clocks, [round.active]: pauseTimer(round.clocks[round.active], now) },
    active: null,
  };
}

/** Stop whatever runs in this debate. */
export function pauseDebate(debate: Debate, now: number): Debate {
  const timed: Record<string, TimedRecord> = {};
  for (const [id, record] of Object.entries(debate.timed)) {
    timed[id] = isRunning(record.timer) ? { ...record, timer: pauseTimer(record.timer, now) } : record;
  }
  return { ...debate, timed, freeRound: pauseFreeRound(debate.freeRound, now) };
}

/**
 * A copy with every running timer paused at its elapsed time. This is what
 * gets stored: timestamps from `performance.now()` are meaningless after a
 * reload, elapsed time is not.
 */
export function freeze(state: AppState, now: number): AppState {
  return {
    ...state,
    debates: state.debates.map((debate) => (debate ? pauseDebate(debate, now) : null)),
  };
}

export function anyRunning(state: AppState): boolean {
  return state.debates.some(
    (debate) =>
      debate !== null &&
      (debate.freeRound.active !== null ||
        Object.values(debate.timed).some((record) => isRunning(record.timer))),
  );
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'set-name'; statement: number; side: Side; slot: number; name: string }
  | { type: 'show'; screen: 'teams' | 'choose' }
  | { type: 'open-debate'; statement: number; now: number }
  | { type: 'leave-debate'; now: number }
  | { type: 'finish-debate'; now: number }
  | { type: 'go-to-step'; step: number; now: number }
  | { type: 'next-step'; now: number }
  | { type: 'previous-step'; now: number }
  | { type: 'toggle-timer'; now: number }
  | { type: 'tap-speaker'; side: Side; slot: number; now: number }
  | { type: 'remove-speaker'; slot: number }
  | { type: 'adjust-free-turns'; side: Side; slot: number; delta: number }
  | { type: 'clear-step' }
  | { type: 'set-votes'; when: 'before' | 'after'; side: Side; value: number }
  | { type: 'toggle-mute' }
  | { type: 'reset-all' };

function replaceAt<T>(list: readonly T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

function addAt(list: readonly number[], index: number, delta: number): number[] {
  return list.map((value, i) => (i === index ? Math.max(0, value + delta) : value));
}

export function clampVotes(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(999, Math.max(0, Math.round(value)));
}

/** The open debate and its current step, or `null` outside a debate. */
export function currentDebate(state: AppState): { index: number; debate: Debate; step: StepDef } | null {
  if (state.screen !== 'debate' || state.current === null) return null;
  const debate = state.debates[state.current];
  if (!debate) return null;
  return { index: state.current, debate, step: STEPS[debate.step] };
}

function updateDebate(state: AppState, update: (debate: Debate, step: StepDef) => Debate): AppState {
  const open = currentDebate(state);
  if (!open) return state;
  const next = update(open.debate, open.step);
  return next === open.debate ? state : { ...state, debates: replaceAt(state.debates, open.index, next) };
}

function moveTo(debate: Debate, step: number, now: number): Debate {
  if (step < 0 || step >= STEPS.length || step === debate.step) return debate;
  // Leaving a step stops its clock. Entering one never starts it.
  return { ...pauseDebate(debate, now), step };
}

function toggleTimer(debate: Debate, step: StepDef, now: number): Debate {
  if (isTimedStep(step)) {
    const record = debate.timed[step.id];
    const timer = isRunning(record.timer) ? pauseTimer(record.timer, now) : startTimer(record.timer, now);
    return { ...debate, timed: { ...debate.timed, [step.id]: { ...record, timer } } };
  }
  if (step.kind === 'free-round') {
    const round = debate.freeRound;
    if (round.active !== null) return { ...debate, freeRound: pauseFreeRound(round, now) };
    if (round.lastSide === null) return debate; // nobody has spoken yet: tap a name
    const side = round.lastSide;
    return {
      ...debate,
      freeRound: { ...round, active: side, clocks: { ...round.clocks, [side]: startTimer(round.clocks[side], now) } },
    };
  }
  return debate;
}

/**
 * A tap on a name in the free round. That student gets the floor and their
 * team's clock runs; the other clock stops. A switch to the other team counts
 * as a team turn, every tap on a new speaker as a speaker turn. A tap on the
 * student who already has the floor only resumes a paused clock — it does not
 * count again, so a double tap cannot inflate the numbers.
 */
export function tapFreeRound(round: FreeRound, side: Side, slot: number, now: number): FreeRound {
  const isCurrent = round.current !== null && round.current.side === side && round.current.slot === slot;
  if (isCurrent && round.active === side) return round;

  let clocks = round.clocks;
  if (round.active !== null && round.active !== side) {
    clocks = { ...clocks, [round.active]: pauseTimer(clocks[round.active], now) };
  }
  clocks = { ...clocks, [side]: startTimer(clocks[side], now) };

  return {
    clocks,
    active: side,
    lastSide: side,
    current: { side, slot },
    teamTurns: round.lastSide === side ? round.teamTurns : { ...round.teamTurns, [side]: round.teamTurns[side] + 1 },
    speakerTurns: isCurrent
      ? round.speakerTurns
      : { ...round.speakerTurns, [side]: addAt(round.speakerTurns[side], slot, 1) },
  };
}

function tapSpeaker(debate: Debate, step: StepDef, side: Side, slot: number, now: number): Debate {
  if (step.kind === 'free-round') {
    return { ...debate, freeRound: tapFreeRound(debate.freeRound, side, slot, now) };
  }
  if (step.kind !== 'speech' || step.side !== side) return debate;
  const record = debate.timed[step.id];
  return {
    ...debate,
    timed: {
      ...debate.timed,
      [step.id]: {
        timer: startTimer(record.timer, now),
        speakers: record.speakers.includes(slot) ? record.speakers : [...record.speakers, slot],
        current: slot,
      },
    },
  };
}

function removeSpeaker(debate: Debate, step: StepDef, slot: number): Debate {
  if (step.kind !== 'speech') return debate;
  const record = debate.timed[step.id];
  if (!record.speakers.includes(slot)) return debate;
  const speakers = record.speakers.filter((s) => s !== slot);
  const current = record.current === slot ? (speakers.length > 0 ? speakers[speakers.length - 1] : null) : record.current;
  return { ...debate, timed: { ...debate.timed, [step.id]: { ...record, speakers, current } } };
}

function clearStep(debate: Debate, step: StepDef): Debate {
  if (isTimedStep(step)) return { ...debate, timed: { ...debate.timed, [step.id]: newTimedRecord() } };
  if (step.kind === 'free-round') return { ...debate, freeRound: newFreeRound() };
  if (step.kind === 'vote-before') return { ...debate, votesBefore: NO_VOTES };
  return { ...debate, votesAfter: NO_VOTES };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set-name': {
      const team = state.teams[action.statement];
      if (!team || action.slot < 0 || action.slot >= TEAM_SLOTS) return state;
      const updated: Team = { ...team, [action.side]: replaceAt(team[action.side], action.slot, action.name) };
      return { ...state, teams: replaceAt(state.teams, action.statement, updated) };
    }
    case 'show':
      return state.screen === 'debate' ? state : { ...state, screen: action.screen };
    case 'open-debate': {
      const team = state.teams[action.statement];
      if (!team || !isPlayable(team)) return state;
      const left = freeze(state, action.now); // nothing else may keep running
      const debate = left.debates[action.statement] ?? newDebate();
      return {
        ...left,
        screen: 'debate',
        current: action.statement,
        debates: replaceAt(left.debates, action.statement, debate),
      };
    }
    case 'leave-debate':
      return { ...freeze(state, action.now), screen: 'choose', current: null };
    case 'finish-debate': {
      const finished = updateDebate(state, (debate) => ({ ...pauseDebate(debate, action.now), done: true }));
      return { ...finished, screen: 'choose', current: null };
    }
    case 'go-to-step':
      return updateDebate(state, (debate) => moveTo(debate, action.step, action.now));
    case 'next-step':
      return updateDebate(state, (debate) => moveTo(debate, debate.step + 1, action.now));
    case 'previous-step':
      return updateDebate(state, (debate) => moveTo(debate, debate.step - 1, action.now));
    case 'toggle-timer':
      return updateDebate(state, (debate, step) => toggleTimer(debate, step, action.now));
    case 'tap-speaker':
      return updateDebate(state, (debate, step) => tapSpeaker(debate, step, action.side, action.slot, action.now));
    case 'remove-speaker':
      return updateDebate(state, (debate, step) => removeSpeaker(debate, step, action.slot));
    case 'adjust-free-turns':
      return updateDebate(state, (debate, step) => {
        if (step.kind !== 'free-round') return debate;
        const round = debate.freeRound;
        return {
          ...debate,
          freeRound: {
            ...round,
            speakerTurns: { ...round.speakerTurns, [action.side]: addAt(round.speakerTurns[action.side], action.slot, action.delta) },
          },
        };
      });
    case 'clear-step':
      return updateDebate(state, (debate, step) => clearStep(debate, step));
    case 'set-votes':
      return updateDebate(state, (debate) => {
        const key = action.when === 'before' ? 'votesBefore' : 'votesAfter';
        return { ...debate, [key]: { ...debate[key], [action.side]: clampVotes(action.value) } };
      });
    case 'toggle-mute':
      return { ...state, muted: !state.muted };
    case 'reset-all':
      return initialState();
  }
}

// ---------------------------------------------------------------------------
// Votes
// ---------------------------------------------------------------------------

export interface Shift {
  /** Hands VOOR after minus hands VOOR before. */
  readonly absolute: number;
  /** Share VOOR after minus share VOOR before, in percentage points. */
  readonly pp: number | null;
  readonly shareBefore: number | null;
  readonly shareAfter: number | null;
}

function shareVoor(votes: Votes): number | null {
  const total = votes.voor + votes.tegen;
  return total > 0 ? votes.voor / total : null;
}

/**
 * The criterion is the shift, not the count. Percentage points stay
 * comparable when the number of voters changes between the two votes; with
 * nobody voting on either side there is no share, and no shift in pp.
 */
export function voteShift(before: Votes, after: Votes): Shift {
  const shareBefore = shareVoor(before);
  const shareAfter = shareVoor(after);
  return {
    absolute: after.voor - before.voor,
    pp: shareBefore !== null && shareAfter !== null ? (shareAfter - shareBefore) * 100 : null,
    shareBefore,
    shareAfter,
  };
}

/** Dutch decimal notation, one decimal, no negative zero. */
export function formatDecimal(value: number, digits = 1): string {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(digits).replace('.', ',');
}

export function formatSigned(value: number, digits = 1): string {
  const text = formatDecimal(value, digits);
  return value > 0 && text !== formatDecimal(0, digits) ? `+${text}` : text;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Quote a field when it holds the separator, a quote or a line break. */
export function csvField(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function speechStepsOf(side: Side): StepDef[] {
  return STEPS.filter((step) => step.kind === 'speech' && step.side === side);
}

/** Number of turns of one student: speech turns plus taps in the free round. */
export function turnsOf(debate: Debate, side: Side, slot: number): number {
  const speeches = speechStepsOf(side).filter((step) => debate.timed[step.id].speakers.includes(slot)).length;
  return speeches + debate.freeRound.speakerTurns[side][slot];
}

function timingCells(planned: number, elapsed: number, held: boolean): string[] {
  if (!held) return [String(planned), '', '', ''];
  const t = timingOf(planned, elapsed);
  return [String(t.planned), String(t.used), String(t.rest), String(t.overtime)];
}

/**
 * One row per student, the team values repeated on each row, so the teacher
 * can filter and pivot in Excel. Times in whole seconds (Excel reads "1:30"
 * as a time of day). `;` separated, UTF-8 with BOM, CRLF — what Excel with a
 * Dutch or Belgian locale opens without an import dialog. Decimals use a
 * comma for the same reason.
 */
export function buildCsv(state: AppState, now: number): string {
  const speechLabels = speechStepsOf('voor').map((step) => step.label.toLowerCase());
  const header = [
    'stelling nr',
    'stelling',
    'kant',
    'leerling',
    'team',
    'beurten leerling',
    ...speechLabels.flatMap((label) => [
      `${label} gepland (s)`,
      `${label} gebruikt (s)`,
      `${label} rest (s)`,
      `${label} overtijd (s)`,
    ]),
    'vrije ronde gepland (s)',
    'vrije ronde gebruikt (s)',
    'vrije ronde rest (s)',
    'vrije ronde overtijd (s)',
    'vrije ronde teambeurten',
    'stemmen VOOR vooraf',
    'stemmen TEGEN vooraf',
    'stemmen VOOR achteraf',
    'stemmen TEGEN achteraf',
    'verschuiving VOOR (stemmen)',
    'verschuiving VOOR (pp)',
    'afgerond',
  ];

  const freeStep = STEPS.find((step) => step.kind === 'free-round');
  const freePlanned = freeStep?.seconds ?? 0;

  const rows: string[][] = [header];
  state.debates.forEach((debate, index) => {
    if (!debate) return;
    const team = state.teams[index];
    const shift = voteShift(debate.votesBefore, debate.votesAfter);
    for (const side of SIDES) {
      const members = membersOf(team, side);
      const teamNames = members.map((member) => member.name).join(', ');
      const speechCells = speechStepsOf(side).flatMap((step) => {
        const timer = debate.timed[step.id].timer;
        const elapsed = elapsedMs(timer, now);
        return timingCells(step.seconds ?? 0, elapsed, elapsed > 0);
      });
      const freeElapsed = elapsedMs(debate.freeRound.clocks[side], now);
      const freeCells = [
        ...timingCells(freePlanned, freeElapsed, freeElapsed > 0),
        String(debate.freeRound.teamTurns[side]),
      ];
      for (const member of members) {
        rows.push([
          String(index + 1),
          STATEMENTS[index],
          SIDE_LABEL[side],
          member.name,
          teamNames,
          String(turnsOf(debate, side, member.slot)),
          ...speechCells,
          ...freeCells,
          String(debate.votesBefore.voor),
          String(debate.votesBefore.tegen),
          String(debate.votesAfter.voor),
          String(debate.votesAfter.tegen),
          String(shift.absolute),
          shift.pp === null ? '' : formatDecimal(shift.pp),
          debate.done ? 'ja' : 'nee',
        ]);
      }
    }
  });

  return '﻿' + rows.map((row) => row.map(csvField).join(';')).join('\r\n') + '\r\n';
}

export function csvFilename(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `debat-graffiti-${yyyy}-${mm}-${dd}.csv`;
}

// ---------------------------------------------------------------------------
// Storage format
// ---------------------------------------------------------------------------

export const STORAGE_KEY = 'cursus-esthetica:debat-graffiti:v1';

export function serialize(state: AppState, now: number): string {
  return JSON.stringify(freeze(state, now));
}

// Reading back is defensive: anything that does not have the expected shape
// falls back to a default instead of crashing the app in front of the class.

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function readSide(value: unknown): Side | null {
  return value === 'voor' || value === 'tegen' ? value : null;
}

function readSlot(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < TEAM_SLOTS ? value : null;
}

function pausedTimer(value: unknown): Timer {
  if (!isObject(value)) return IDLE_TIMER;
  const acc = value.accMs;
  return { accMs: typeof acc === 'number' && Number.isFinite(acc) && acc >= 0 ? acc : 0, since: null };
}

function slotsOf<T>(value: unknown, read: (item: unknown) => T, fallback: T): T[] {
  const list = Array.isArray(value) ? value : [];
  return Array.from({ length: TEAM_SLOTS }, (_, i) => (i < list.length ? read(list[i]) : fallback));
}

function readTeam(value: unknown): Team {
  const team = isObject(value) ? value : {};
  const name = (item: unknown) => (typeof item === 'string' ? item : '');
  return { voor: slotsOf(team.voor, name, ''), tegen: slotsOf(team.tegen, name, '') };
}

function readVotes(value: unknown): Votes {
  const votes = isObject(value) ? value : {};
  return { voor: clampVotes(count(votes.voor)), tegen: clampVotes(count(votes.tegen)) };
}

function readTimed(value: unknown): TimedRecord {
  const record = isObject(value) ? value : {};
  const speakers = Array.isArray(record.speakers)
    ? record.speakers.map(readSlot).filter((s): s is number => s !== null)
    : [];
  const unique = speakers.filter((s, i) => speakers.indexOf(s) === i);
  const current = readSlot(record.current);
  return { timer: pausedTimer(record.timer), speakers: unique, current: current !== null && unique.includes(current) ? current : null };
}

function readFreeRound(value: unknown): FreeRound {
  const round = isObject(value) ? value : {};
  const clocks = isObject(round.clocks) ? round.clocks : {};
  const teamTurns = isObject(round.teamTurns) ? round.teamTurns : {};
  const speakerTurns = isObject(round.speakerTurns) ? round.speakerTurns : {};
  const current = isObject(round.current) ? round.current : null;
  const currentSide = current ? readSide(current.side) : null;
  const currentSlot = current ? readSlot(current.slot) : null;
  return {
    clocks: { voor: pausedTimer(clocks.voor), tegen: pausedTimer(clocks.tegen) },
    active: null,
    lastSide: readSide(round.lastSide),
    current: currentSide !== null && currentSlot !== null ? { side: currentSide, slot: currentSlot } : null,
    teamTurns: { voor: count(teamTurns.voor), tegen: count(teamTurns.tegen) },
    speakerTurns: { voor: slotsOf(speakerTurns.voor, count, 0), tegen: slotsOf(speakerTurns.tegen, count, 0) },
  };
}

function readDebate(value: unknown): Debate | null {
  if (!isObject(value)) return null;
  const timedIn = isObject(value.timed) ? value.timed : {};
  const timed: Record<string, TimedRecord> = {};
  for (const step of STEPS) {
    if (isTimedStep(step)) timed[step.id] = readTimed(timedIn[step.id]);
  }
  return {
    step: Math.min(STEPS.length - 1, count(value.step)),
    timed,
    freeRound: readFreeRound(value.freeRound),
    votesBefore: readVotes(value.votesBefore),
    votesAfter: readVotes(value.votesAfter),
    done: value.done === true,
  };
}

/** Parse stored state. Returns `null` when there is nothing usable. */
export function deserialize(raw: string | null): AppState | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data) || data.version !== 1) return null;
  const teamsIn = Array.isArray(data.teams) ? data.teams : [];
  const debatesIn = Array.isArray(data.debates) ? data.debates : [];
  const teams = STATEMENTS.map((_, i) => readTeam(teamsIn[i]));
  const debates = STATEMENTS.map((_, i) => readDebate(debatesIn[i]));
  const current =
    typeof data.current === 'number' && Number.isInteger(data.current) && debates[data.current] ? data.current : null;
  const screen: Screen =
    data.screen === 'debate' && current !== null ? 'debate' : data.screen === 'choose' ? 'choose' : 'teams';
  return {
    version: 1,
    screen,
    teams,
    debates,
    current: screen === 'debate' ? current : null,
    muted: data.muted === true,
  };
}
