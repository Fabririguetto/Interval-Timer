import { WorkoutRoutine, Exercise, GlobalTiming, IntervalPhase, ExerciseTimingOverride } from '../types/workout';

let _id = 0;
const uid = () => String(++_id);

// ─── Timing Resolution ───────────────────────────────────────────────────────

function resolveTimings(
  exercise: Exercise,
  global: GlobalTiming,
): Required<ExerciseTimingOverride> {
  if (exercise.useGlobalTiming || !exercise.override) {
    return {
      workDuration: global.workDuration,
      restDuration: global.restDuration,
      sets: global.sets,
      transitionDuration: global.transitionDuration,
    };
  }
  return {
    workDuration: exercise.override.workDuration ?? global.workDuration,
    restDuration: exercise.override.restDuration ?? global.restDuration,
    sets: exercise.override.sets ?? global.sets,
    transitionDuration: exercise.override.transitionDuration ?? global.transitionDuration,
  };
}

// ─── Phase Queue Builder ─────────────────────────────────────────────────────

/**
 * Converts a WorkoutRoutine into a flat ordered array of IntervalPhases.
 *
 * Structure:
 *   [prepare]
 *   Round 1: Ex1(work→rest…) → [transition] → Ex2(work→rest…) → …
 *   [rest_between_rounds]
 *   Round 2: …
 *   [rest_between_rounds]
 *   Round N: …
 */
export function buildPhaseQueue(routine: WorkoutRoutine): IntervalPhase[] {
  const phases: IntervalPhase[] = [];
  const { globalTiming, exercises } = routine;

  if (!exercises.length) return phases;

  const rounds = Math.max(1, globalTiming.rounds ?? 1);
  const restBetweenRounds = globalTiming.restBetweenRounds ?? 0;

  // Initial countdown
  if (globalTiming.prepareDuration > 0) {
    phases.push({
      id: uid(),
      type: 'prepare',
      duration: globalTiming.prepareDuration,
      exerciseIndex: 0,
      exerciseName: exercises[0].name,
      setNumber: 0,
      totalSets: 0,
      roundNumber: 1,
      totalRounds: rounds,
    });
  }

  for (let round = 1; round <= rounds; round++) {
    const isLastRound = round === rounds;

    exercises.forEach((exercise, exIdx) => {
      const t = resolveTimings(exercise, globalTiming);
      const isLastExercise = exIdx === exercises.length - 1;

      for (let set = 1; set <= t.sets; set++) {
        const isLastSet = set === t.sets;

        phases.push({
          id: uid(),
          type: 'work',
          duration: t.workDuration,
          exerciseIndex: exIdx,
          exerciseName: exercise.name,
          setNumber: set,
          totalSets: t.sets,
          roundNumber: round,
          totalRounds: rounds,
        });

        if (!isLastSet) {
          phases.push({
            id: uid(),
            type: 'rest',
            duration: t.restDuration,
            exerciseIndex: exIdx,
            exerciseName: exercise.name,
            setNumber: set,
            totalSets: t.sets,
            roundNumber: round,
            totalRounds: rounds,
          });
        }
      }

      if (!isLastExercise && t.transitionDuration > 0) {
        phases.push({
          id: uid(),
          type: 'transition',
          duration: t.transitionDuration,
          exerciseIndex: exIdx + 1,
          exerciseName: exercises[exIdx + 1].name,
          setNumber: 0,
          totalSets: 0,
          roundNumber: round,
          totalRounds: rounds,
        });
      }
    });

    if (!isLastRound && restBetweenRounds > 0) {
      phases.push({
        id: uid(),
        type: 'rest_between_rounds',
        duration: restBetweenRounds,
        exerciseIndex: 0,
        exerciseName: exercises[0].name,
        setNumber: 0,
        totalSets: 0,
        roundNumber: round,
        totalRounds: rounds,
      });
    }
  }

  return phases;
}

// ─── Time Calculation ────────────────────────────────────────────────────────

/** Returns total routine duration in seconds */
export function calculateTotalDuration(routine: WorkoutRoutine): number {
  return buildPhaseQueue(routine).reduce((sum, p) => sum + p.duration, 0);
}

/** Breakdown by phase type — useful for the summary footer */
export interface DurationBreakdown {
  total: number;
  prepare: number;
  work: number;
  rest: number;
  transition: number;
  rest_between_rounds: number;
}

export function calculateBreakdown(routine: WorkoutRoutine): DurationBreakdown {
  const phases = buildPhaseQueue(routine);
  return phases.reduce(
    (acc, p) => {
      acc.total += p.duration;
      if (p.type !== 'done') acc[p.type] += p.duration;
      return acc;
    },
    { total: 0, prepare: 0, work: 0, rest: 0, transition: 0, rest_between_rounds: 0 },
  );
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

export function formatMMSS(seconds: number): { mm: string; ss: string } {
  return {
    mm: pad(Math.floor(seconds / 60)),
    ss: pad(seconds % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
