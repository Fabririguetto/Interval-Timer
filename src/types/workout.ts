// ─── Phase Types ────────────────────────────────────────────────────────────

/** Phases that occur during a workout execution session */
export type PhaseType =
  | 'prepare'
  | 'work'
  | 'rest'
  | 'transition'
  | 'rest_between_rounds'
  | 'done';

/** A single discrete interval in the execution queue */
export interface IntervalPhase {
  id: string;
  type: PhaseType;
  duration: number;        // seconds
  exerciseIndex: number;
  exerciseName: string;
  setNumber: number;       // 1-based; 0 for non-set phases
  totalSets: number;
  roundNumber: number;     // 1-based
  totalRounds: number;
}

// ─── Exercise Definition ─────────────────────────────────────────────────────

/** Per-exercise timing that overrides the global config */
export interface ExerciseTimingOverride {
  workDuration?: number;       // seconds
  restDuration?: number;       // seconds
  sets?: number;
  transitionDuration?: number; // rest before the NEXT exercise
}

export interface Exercise {
  id: string;
  name: string;
  useGlobalTiming: boolean;
  override?: ExerciseTimingOverride;
}

// ─── Routine / Preset ────────────────────────────────────────────────────────

/** Default timing applied to all exercises unless overridden */
export interface GlobalTiming {
  prepareDuration: number;     // countdown before the first exercise (seconds)
  workDuration: number;        // active work interval (seconds)
  restDuration: number;        // rest between sets (seconds)
  sets: number;                 // work/rest cycles per exercise
  transitionDuration: number;   // rest between exercises (seconds)
  rounds: number;               // times the full exercise list repeats
  restBetweenRounds: number;    // rest between rounds (seconds)
}

/** A complete named workout configuration */
export interface WorkoutRoutine {
  id: string;
  name: string;
  globalTiming: GlobalTiming;
  exercises: Exercise[];
  createdAt: number;  // Unix ms
  updatedAt: number;  // Unix ms
}

// WorkoutRoutine and Preset are the same shape; Preset is the saved form
export type Preset = WorkoutRoutine;

// ─── Default Values ──────────────────────────────────────────────────────────

export const DEFAULT_GLOBAL_TIMING: GlobalTiming = {
  prepareDuration: 10,
  workDuration: 40,
  restDuration: 20,
  sets: 4,
  transitionDuration: 60,
  rounds: 3,
  restBetweenRounds: 90,
};

export const DEFAULT_ROUTINE: Omit<WorkoutRoutine, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Mi Rutina',
  globalTiming: DEFAULT_GLOBAL_TIMING,
  exercises: [],
};
