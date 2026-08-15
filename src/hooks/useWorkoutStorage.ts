import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutRoutine, Preset, DEFAULT_GLOBAL_TIMING } from '../types/workout';

const STORAGE_KEY = '@interval_timer/presets';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeDefaultPreset(): Preset {
  const now = Date.now();
  return {
    id: generateId(),
    name: 'HIIT Rápido',
    globalTiming: DEFAULT_GLOBAL_TIMING,
    exercises: [
      { id: generateId(), name: 'Sentadillas', useGlobalTiming: true },
      { id: generateId(), name: 'Burpees', useGlobalTiming: true },
      { id: generateId(), name: 'Mountain Climbers', useGlobalTiming: true },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function useWorkoutStorage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Preset[] = JSON.parse(raw);
        setPresets(saved);
        setActiveRoutine(saved[0] ?? null);
      } else {
        const def = makeDefaultPreset();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([def]));
        setPresets([def]);
        setActiveRoutine(def);
      }
    } catch {
      const def = makeDefaultPreset();
      setPresets([def]);
      setActiveRoutine(def);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback(async (updated: Preset[]) => {
    setPresets(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const saveRoutine = useCallback(async (routine: WorkoutRoutine) => {
    const now = Date.now();
    const updated = { ...routine, updatedAt: now };
    const list = presets.some(p => p.id === routine.id)
      ? presets.map(p => (p.id === routine.id ? updated : p))
      : [...presets, updated];
    await persist(list);
    setActiveRoutine(updated);
    return updated;
  }, [presets, persist]);

  const createRoutine = useCallback(async (name: string): Promise<WorkoutRoutine> => {
    const now = Date.now();
    const routine: WorkoutRoutine = {
      id: generateId(),
      name,
      globalTiming: activeRoutine?.globalTiming ?? DEFAULT_GLOBAL_TIMING,
      exercises: [],
      createdAt: now,
      updatedAt: now,
    };
    await persist([...presets, routine]);
    setActiveRoutine(routine);
    return routine;
  }, [presets, persist, activeRoutine]);

  const deleteRoutine = useCallback(async (id: string) => {
    const list = presets.filter(p => p.id !== id);
    await persist(list);
    if (activeRoutine?.id === id) {
      setActiveRoutine(list[0] ?? null);
    }
  }, [presets, persist, activeRoutine]);

  const selectRoutine = useCallback((id: string) => {
    const found = presets.find(p => p.id === id);
    if (found) setActiveRoutine(found);
  }, [presets]);

  return {
    presets,
    activeRoutine,
    loading,
    reload: load,
    setActiveRoutine,
    saveRoutine,
    createRoutine,
    deleteRoutine,
    selectRoutine,
  };
}
