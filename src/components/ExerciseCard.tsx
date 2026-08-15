import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { Exercise, ExerciseTimingOverride, GlobalTiming } from '../types/workout';
import { UI } from '../constants/theme';


interface Props {
  exercise: Exercise;
  index: number;
  total: number;
  globalTiming: GlobalTiming;
  onUpdate: (updated: Exercise) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ExerciseCard({ exercise, index, total, globalTiming, onUpdate, onDelete, onMoveUp, onMoveDown }: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  const toggleTiming = () => {
    onUpdate({ ...exercise, useGlobalTiming: !exercise.useGlobalTiming, override: undefined });
  };

  const setOverride = (key: keyof ExerciseTimingOverride, val: string) => {
    const num = parseInt(val, 10);
    onUpdate({
      ...exercise,
      override: { ...exercise.override, [key]: isNaN(num) ? undefined : num },
    });
  };

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.dragHandle}>
          <Text style={styles.dragIcon}>⠿</Text>
        </View>

        <TextInput
          style={styles.nameInput}
          value={exercise.name}
          onChangeText={name => onUpdate({ ...exercise, name })}
          placeholder="Nombre del ejercicio"
          placeholderTextColor={UI.textTertiary}
          selectionColor={UI.primary}
        />

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.actionIcon}>{expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionIcon, { color: UI.danger }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Collapsed summary */}
      {!expanded && (
        <View style={styles.summary}>
          {exercise.useGlobalTiming ? (
            <Text style={styles.summaryText}>Usa tiempos globales</Text>
          ) : (
            <Text style={styles.summaryText}>
              {`${exercise.override?.workDuration ?? globalTiming.workDuration}s trabajo  ·  `}
              {`${exercise.override?.restDuration ?? globalTiming.restDuration}s descanso  ·  `}
              {`${exercise.override?.sets ?? globalTiming.sets} series`}
            </Text>
          )}
        </View>
      )}

      {/* Expanded configuration */}
      {expanded && (
        <View style={styles.expandedBody}>
          {/* Global toggle */}
          <TouchableOpacity style={styles.toggleRow} onPress={toggleTiming}>
            <View style={[styles.toggle, exercise.useGlobalTiming && styles.toggleOn]}>
              <View style={[styles.toggleThumb, exercise.useGlobalTiming && styles.toggleThumbOn]} />
            </View>
            <Text style={styles.toggleLabel}>Usar tiempos globales</Text>
          </TouchableOpacity>

          {/* Custom fields */}
          {!exercise.useGlobalTiming && (
            <View style={styles.fields}>
              <TimingField
                label="Trabajo (s)"
                value={String(exercise.override?.workDuration ?? globalTiming.workDuration)}
                placeholder={String(globalTiming.workDuration)}
                onChange={v => setOverride('workDuration', v)}
              />
              <TimingField
                label="Descanso (s)"
                value={String(exercise.override?.restDuration ?? globalTiming.restDuration)}
                placeholder={String(globalTiming.restDuration)}
                onChange={v => setOverride('restDuration', v)}
              />
              <TimingField
                label="Series"
                value={String(exercise.override?.sets ?? globalTiming.sets)}
                placeholder={String(globalTiming.sets)}
                onChange={v => setOverride('sets', v)}
              />
              <TimingField
                label="Transición (s)"
                value={String(exercise.override?.transitionDuration ?? globalTiming.transitionDuration)}
                placeholder={String(globalTiming.transitionDuration)}
                onChange={v => setOverride('transitionDuration', v)}
              />
            </View>
          )}

          {/* Reorder */}
          <View style={styles.reorderRow}>
            <TouchableOpacity
              style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
              onPress={onMoveUp}
              disabled={index === 0}
            >
              <Text style={styles.reorderIcon}>↑</Text>
            </TouchableOpacity>
            <Text style={styles.positionLabel}>{index + 1} / {total}</Text>
            <TouchableOpacity
              style={[styles.reorderBtn, index === total - 1 && styles.reorderBtnDisabled]}
              onPress={onMoveDown}
              disabled={index === total - 1}
            >
              <Text style={styles.reorderIcon}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function TimingField({ label, value, placeholder, onChange }: {
  label: string; value: string; placeholder: string; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={UI.textTertiary}
        keyboardType="numeric"
        maxLength={4}
        selectionColor={UI.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI.surface,
    borderRadius: UI.radius.md,
    marginBottom: UI.spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 10,
  },
  dragHandle: { marginRight: 8 },
  dragIcon: { fontSize: 20, color: UI.textTertiary },
  nameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: UI.textPrimary,
    paddingVertical: 0,
  },
  headerActions: { flexDirection: 'row', gap: 14, marginLeft: 8 },
  actionIcon: { fontSize: 16, color: UI.textSecondary },
  summary: { paddingHorizontal: UI.spacing.md, paddingBottom: 10 },
  summaryText: { fontSize: 12, color: UI.textSecondary },
  expandedBody: { paddingHorizontal: UI.spacing.md, paddingBottom: UI.spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  toggle: {
    width: 40, height: 22, borderRadius: 11,
    backgroundColor: UI.textTertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: UI.primary },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleLabel: { marginLeft: 10, fontSize: 13, color: UI.textSecondary },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  field: { flex: 1, minWidth: '45%' },
  fieldLabel: { fontSize: 11, color: UI.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: {
    backgroundColor: UI.surfaceHigh,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 15,
    fontWeight: '600',
    color: UI.textPrimary,
    textAlign: 'center',
  },
  reorderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  reorderBtn: {
    backgroundColor: UI.surfaceHigh,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  reorderBtnDisabled: { opacity: 0.3 },
  reorderIcon: { fontSize: 18, color: UI.textPrimary, fontWeight: '700' },
  positionLabel: { fontSize: 13, color: UI.textSecondary, minWidth: 40, textAlign: 'center' },
});
