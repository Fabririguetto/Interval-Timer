import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useWorkoutStorage } from '../hooks/useWorkoutStorage';
import { ExerciseCard } from '../components/ExerciseCard';
import { calculateTotalDuration, formatSeconds } from '../utils/phaseBuilder';
import { UI } from '../constants/theme';
import type { Exercise, GlobalTiming, WorkoutRoutine } from '../types/workout';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function EditorScreen({ navigation, route }: Props) {
  const { routineId } = route.params;
  const { presets, loading, saveRoutine } = useWorkoutStorage();

  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [saving, setSaving] = useState(false);

  // Refs so the beforeRemove listener always sees fresh values
  const routineRef = useRef<WorkoutRoutine | null>(null);
  routineRef.current = routine;
  const saveRef = useRef(saveRoutine);
  saveRef.current = saveRoutine;
  const savedOnNavigateRef = useRef(false);

  // Load routine once presets are available
  useEffect(() => {
    if (!loading) {
      const found = presets.find(p => p.id === routineId);
      setRoutine(found ?? null);
    }
  }, [loading, presets, routineId]);

  const handleSave = useCallback(async () => {
    if (!routineRef.current || saving) return;
    setSaving(true);
    savedOnNavigateRef.current = true;
    await saveRef.current(routineRef.current);
    setSaving(false);
  }, [saving]);

  // Update header title and save button when relevant state changes
  useEffect(() => {
    if (!routine) return;
    navigation.setOptions({
      title: routine.name || 'Editar Rutina',
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({ opacity: pressed || saving ? 0.5 : 1, paddingHorizontal: 4 })}
        >
          <Text style={headerSaveStyle}>{saving ? 'Guardando...' : 'Guardar'}</Text>
        </Pressable>
      ),
    });
  }, [routine?.name, saving, navigation, handleSave]);

  // Auto-save on back navigation
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (routineRef.current && !savedOnNavigateRef.current) {
        saveRef.current(routineRef.current);
      }
    });
  }, [navigation]);

  const updateGlobal = useCallback((key: keyof GlobalTiming, val: string) => {
    const num = parseInt(val, 10);
    setRoutine(r => r
      ? { ...r, globalTiming: { ...r.globalTiming, [key]: isNaN(num) ? 0 : num } }
      : r
    );
  }, []);

  const updateExercise = useCallback((idx: number, updated: Exercise) => {
    setRoutine(r => {
      if (!r) return r;
      const exercises = [...r.exercises];
      exercises[idx] = updated;
      return { ...r, exercises };
    });
  }, []);

  const deleteExercise = useCallback((idx: number) => {
    setRoutine(r => r
      ? { ...r, exercises: r.exercises.filter((_, i) => i !== idx) }
      : r
    );
  }, []);

  const moveExercise = useCallback((idx: number, dir: 1 | -1) => {
    setRoutine(r => {
      if (!r) return r;
      const exercises = [...r.exercises];
      const to = idx + dir;
      if (to < 0 || to >= exercises.length) return r;
      [exercises[idx], exercises[to]] = [exercises[to], exercises[idx]];
      return { ...r, exercises };
    });
  }, []);

  const addExercise = useCallback(() => {
    setRoutine(r => r
      ? { ...r, exercises: [...r.exercises, { id: generateId(), name: '', useGlobalTiming: true }] }
      : r
    );
  }, []);

  const handleStart = useCallback(async () => {
    if (!routine) return;
    if (routine.exercises.length === 0) {
      Alert.alert('Sin ejercicios', 'Agrega al menos un ejercicio antes de iniciar.');
      return;
    }
    savedOnNavigateRef.current = true;
    await saveRoutine(routine);
    navigation.navigate('Timer', { routineId: routine.id });
  }, [routine, saveRoutine, navigation]);

  if (loading || !routine) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={UI.primary} />
      </View>
    );
  }

  const totalSecs = calculateTotalDuration(routine);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : -120}
      >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >

        {/* Routine name */}
        <TextInput
          style={styles.routineName}
          value={routine.name}
          onChangeText={name => setRoutine(r => r ? { ...r, name } : r)}
          placeholder="Nombre de la rutina"
          placeholderTextColor={UI.textTertiary}
          selectionColor={UI.primary}
        />

        {/* Global timing */}
        <Text style={styles.sectionHeader}>TIEMPOS GLOBALES</Text>
        <View style={styles.globalCard}>
          <View style={styles.fields}>
            <GlobalField label="Preparacion" unit="s" value={String(routine.globalTiming.prepareDuration)} onChange={v => updateGlobal('prepareDuration', v)} />
            <GlobalField label="Trabajo" unit="s" value={String(routine.globalTiming.workDuration)} onChange={v => updateGlobal('workDuration', v)} />
            <GlobalField label="Descanso" unit="s" value={String(routine.globalTiming.restDuration)} onChange={v => updateGlobal('restDuration', v)} />
            <GlobalField label="Series" unit="" value={String(routine.globalTiming.sets)} onChange={v => updateGlobal('sets', v)} />
            <GlobalField label="Transicion" unit="s" value={String(routine.globalTiming.transitionDuration)} onChange={v => updateGlobal('transitionDuration', v)} />
            <GlobalField label="Rondas" unit="" value={String(routine.globalTiming.rounds)} onChange={v => updateGlobal('rounds', v)} />
            <GlobalField label="Entre rondas" unit="s" value={String(routine.globalTiming.restBetweenRounds)} onChange={v => updateGlobal('restBetweenRounds', v)} />
          </View>
          {totalSecs > 0 && (
            <Text style={styles.totalTime}>Total estimado: {formatSeconds(totalSecs)}</Text>
          )}
        </View>

        {/* Exercises */}
        <Text style={styles.sectionHeader}>EJERCICIOS</Text>
        {routine.exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            index={idx}
            total={routine.exercises.length}
            globalTiming={routine.globalTiming}
            onUpdate={updated => updateExercise(idx, updated)}
            onDelete={() => deleteExercise(idx)}
            onMoveUp={() => moveExercise(idx, -1)}
            onMoveDown={() => moveExercise(idx, 1)}
          />
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addExercise} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+ Agregar ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, routine.exercises.length === 0 && styles.startBtnDisabled]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Iniciar Timer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const headerSaveStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: UI.primary,
};

function GlobalField({
  label, unit, value, onChange,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.globalField}>
      <Text style={styles.globalFieldLabel}>{label}{unit ? ` (${unit})` : ''}</Text>
      <TextInput
        style={styles.globalFieldInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        maxLength={4}
        selectionColor={UI.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: UI.bg },
  scroll: { padding: UI.spacing.md, paddingBottom: 120 },
  routineName: {
    fontSize: 24,
    fontWeight: '800',
    color: UI.textPrimary,
    marginBottom: UI.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: UI.border,
    paddingBottom: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: UI.textTertiary,
    letterSpacing: 1.2,
    marginTop: UI.spacing.md,
    marginBottom: UI.spacing.sm,
  },
  globalCard: {
    backgroundColor: UI.surface,
    borderRadius: UI.radius.md,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: UI.border,
  },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  globalField: { flex: 1, minWidth: '30%' },
  globalFieldLabel: {
    fontSize: 10, color: UI.textSecondary, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  globalFieldInput: {
    backgroundColor: UI.surfaceHigh,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 8, paddingVertical: 8,
    fontSize: 16, fontWeight: '700',
    color: UI.textPrimary, textAlign: 'center',
  },
  totalTime: { fontSize: 12, color: UI.primary, marginTop: 12, textAlign: 'right', fontWeight: '600' },
  addBtn: {
    borderWidth: 1, borderColor: UI.border, borderStyle: 'dashed',
    borderRadius: UI.radius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  addBtnText: { color: UI.textSecondary, fontSize: 15 },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: UI.spacing.md, paddingBottom: 24,
    backgroundColor: UI.bg,
    borderTopWidth: 1, borderTopColor: UI.border,
  },
  startBtn: {
    backgroundColor: UI.primary,
    borderRadius: UI.radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});
