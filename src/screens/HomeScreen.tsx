import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useWorkoutStorage } from '../hooks/useWorkoutStorage';
import { calculateTotalDuration, formatSeconds } from '../utils/phaseBuilder';
import { UI } from '../constants/theme';
import type { Preset } from '../types/workout';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { presets, loading, reload, createRoutine, deleteRoutine } = useWorkoutStorage();

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleCreate = useCallback(async () => {
    const routine = await createRoutine('Nueva Rutina');
    navigation.navigate('Editor', { routineId: routine.id });
  }, [createRoutine, navigation]);

  const handleDelete = useCallback((preset: Preset) => {
    Alert.alert(
      'Eliminar rutina',
      `¿Eliminar "${preset.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteRoutine(preset.id) },
      ],
    );
  }, [deleteRoutine]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={UI.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={presets}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay rutinas guardadas.</Text>
            <Text style={styles.emptyHint}>Crea una con el botón +</Text>
          </View>
        }
        renderItem={({ item }) => {
          const total = calculateTotalDuration(item);
          const exCount = item.exercises.length;
          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => navigation.navigate('Editor', { routineId: item.id })}
                activeOpacity={0.7}
              >
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {exCount} ejercicio{exCount !== 1 ? 's' : ''}
                  {total > 0 ? `  ·  ${formatSeconds(total)}` : ''}
                </Text>
              </TouchableOpacity>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => navigation.navigate('Timer', { routineId: item.id })}
                  disabled={exCount === 0}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.playIcon, exCount === 0 && { opacity: 0.3 }]}>▶</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: UI.bg },
  list: { padding: UI.spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: UI.textSecondary, fontSize: 16, marginBottom: 8 },
  emptyHint: { color: UI.textTertiary, fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.surface,
    borderRadius: UI.radius.md,
    marginBottom: UI.spacing.sm,
    borderWidth: 1,
    borderColor: UI.border,
    overflow: 'hidden',
  },
  cardMain: { flex: 1, paddingHorizontal: UI.spacing.md, paddingVertical: 14 },
  cardName: { fontSize: 16, fontWeight: '700', color: UI.textPrimary, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: UI.textSecondary },
  cardActions: { flexDirection: 'row', borderLeftWidth: 1, borderLeftColor: UI.border },
  playBtn: {
    paddingHorizontal: 16, paddingVertical: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  playIcon: { fontSize: 18, color: UI.primary },
  deleteBtn: {
    paddingHorizontal: 14, paddingVertical: 14,
    justifyContent: 'center', alignItems: 'center',
    borderLeftWidth: 1, borderLeftColor: UI.border,
  },
  deleteIcon: { fontSize: 14, color: UI.danger },
  fab: {
    position: 'absolute',
    bottom: 24, right: 24,
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: UI.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
