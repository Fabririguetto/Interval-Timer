import { useState, useRef, useCallback, useEffect } from 'react';
import { IntervalPhase, PhaseType } from '../types/workout';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

export interface TimerSnapshot {
  status: TimerStatus;
  phase: IntervalPhase | null;
  phaseIndex: number;
  totalPhases: number;
  secondsLeft: number;
  /** 0→1 progress within the current phase */
  phaseProgress: number;
  /** 0→1 overall workout completion */
  workoutProgress: number;
}

export interface UseTimerCallbacks {
  onPhaseChange?: (phase: IntervalPhase, index: number) => void;
  /** Fires every second — use for haptics / sound */
  onTick?: (secondsLeft: number, phase: IntervalPhase) => void;
  onComplete?: () => void;
}

// ─── Internal context (lives in a ref, never triggers re-renders) ─────────────

interface TimerCtx {
  phases: IntervalPhase[];
  phaseIdx: number;
  endAt: number;       // absolute ms when current phase expires
  pendingMs: number;   // remaining ms captured at pause
  running: boolean;
}

const IDLE: TimerSnapshot = {
  status: 'idle',
  phase: null,
  phaseIndex: 0,
  totalPhases: 0,
  secondsLeft: 0,
  phaseProgress: 0,
  workoutProgress: 0,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Timestamp-based interval timer — accurate regardless of JS event-loop lag.
 *
 * Strategy:
 *   - All mutable timing state lives in a ref (ctx) so setInterval callbacks
 *     always read fresh values without closure staleness.
 *   - We record `endAt = Date.now() + remainingMs` and compute remaining from
 *     that on each tick. This means accumulated drift is zero — every tick
 *     corrects itself against wall time.
 *   - React state (`snapshot`) is updated only when the displayed second
 *     changes, keeping renders at ~1 fps during countdown.
 */
export function useTimer(callbacks: UseTimerCallbacks = {}) {
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(IDLE);

  const ctx = useRef<TimerCtx>({
    phases: [],
    phaseIdx: 0,
    endAt: 0,
    pendingMs: 0,
    running: false,
  });

  const handle = useRef<ReturnType<typeof setInterval> | null>(null);
  const cb = useRef(callbacks);
  cb.current = callbacks;

  // Tracks the last whole-second value to avoid redundant setState calls
  const lastSecRef = useRef(-1);

  // ── Core: advance to a phase by index ──────────────────────────────────────

  const goToPhase = useCallback((idx: number) => {
    const c = ctx.current;

    if (idx >= c.phases.length) {
      // Workout finished
      if (handle.current) clearInterval(handle.current);
      handle.current = null;
      c.running = false;
      const lastPhase = c.phases[c.phases.length - 1] ?? null;
      setSnapshot({
        status: 'done',
        phase: lastPhase,
        phaseIndex: c.phases.length,
        totalPhases: c.phases.length,
        secondsLeft: 0,
        phaseProgress: 1,
        workoutProgress: 1,
      });
      cb.current.onComplete?.();
      return;
    }

    const phase = c.phases[idx];
    const now = Date.now();
    c.phaseIdx = idx;
    c.endAt = now + phase.duration * 1000;
    c.pendingMs = phase.duration * 1000;
    lastSecRef.current = -1;

    setSnapshot(s => ({
      ...s,
      status: 'running',
      phase,
      phaseIndex: idx,
      totalPhases: c.phases.length,
      secondsLeft: phase.duration,
      phaseProgress: 0,
      workoutProgress: idx / c.phases.length,
    }));

    cb.current.onPhaseChange?.(phase, idx);
  }, []);

  // ── Tick: runs every 50 ms, compares wall time ─────────────────────────────

  const tick = useCallback(() => {
    const c = ctx.current;
    if (!c.running) return;

    const now = Date.now();
    const remainMs = c.endAt - now;

    if (remainMs <= 0) {
      goToPhase(c.phaseIdx + 1);
      return;
    }

    const secondsLeft = Math.ceil(remainMs / 1000);
    if (secondsLeft === lastSecRef.current) return; // no display change
    lastSecRef.current = secondsLeft;

    const phase = c.phases[c.phaseIdx];
    const elapsed = phase.duration - secondsLeft;
    const phaseProgress = elapsed / phase.duration;
    const totalElapsed = c.phases
      .slice(0, c.phaseIdx)
      .reduce((s, p) => s + p.duration, 0) + elapsed;
    const totalDuration = c.phases.reduce((s, p) => s + p.duration, 0);
    const workoutProgress = totalDuration > 0 ? totalElapsed / totalDuration : 0;

    cb.current.onTick?.(secondsLeft, phase);
    setSnapshot(s => ({ ...s, secondsLeft, phaseProgress, workoutProgress }));
  }, [goToPhase]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (handle.current) clearInterval(handle.current);
    };
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Load phases and start from the beginning */
  const start = useCallback((phases: IntervalPhase[]) => {
    if (handle.current) clearInterval(handle.current);
    ctx.current.phases = phases;
    ctx.current.running = true;
    lastSecRef.current = -1;
    goToPhase(0);
    handle.current = setInterval(tick, 50);
  }, [goToPhase, tick]);

  const pause = useCallback(() => {
    const c = ctx.current;
    if (!c.running) return;
    c.pendingMs = c.endAt - Date.now();
    c.running = false;
    if (handle.current) clearInterval(handle.current);
    handle.current = null;
    setSnapshot(s => ({ ...s, status: 'paused' }));
  }, []);

  const resume = useCallback(() => {
    const c = ctx.current;
    if (c.running || c.pendingMs <= 0 || c.phaseIdx >= c.phases.length) return;
    c.endAt = Date.now() + c.pendingMs;
    c.running = true;
    lastSecRef.current = -1;
    if (handle.current) clearInterval(handle.current);
    handle.current = setInterval(tick, 50);
    setSnapshot(s => ({ ...s, status: 'running' }));
  }, [tick]);

  const skip = useCallback(() => {
    const c = ctx.current;
    if (!c.running && c.pendingMs <= 0) return;
    if (c.phaseIdx >= c.phases.length) return;
    if (!c.running) {
      c.running = true;
      if (handle.current) clearInterval(handle.current);
      handle.current = setInterval(tick, 50);
    }
    goToPhase(c.phaseIdx + 1);
  }, [goToPhase, tick]);

  const restart = useCallback(() => {
    if (snapshot.status === 'idle') return;
    const c = ctx.current;
    if (!c.running) {
      c.running = true;
      handle.current = setInterval(tick, 50);
    }
    goToPhase(0);
  }, [goToPhase, tick, snapshot.status]);

  const stop = useCallback(() => {
    if (handle.current) clearInterval(handle.current);
    handle.current = null;
    ctx.current.running = false;
    setSnapshot(IDLE);
  }, []);

  return { snapshot, start, pause, resume, skip, restart, stop };
}
