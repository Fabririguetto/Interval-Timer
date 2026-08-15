import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useWorkoutStorage } from '../hooks/useWorkoutStorage';
import { useTimer } from '../hooks/useTimer';
import { useWorkoutAudio } from '../hooks/useWorkoutAudio';
import { buildPhaseQueue, formatMMSS } from '../utils/phaseBuilder';
import { CircularProgress } from '../components/CircularProgress';
import { PHASE_COLORS, PHASE_LABELS } from '../constants/theme';
import type { PhaseType } from '../types/workout';

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;

type ColorKey = PhaseType | 'idle';

export function TimerScreen({ navigation, route }: Props) {
  const { routineId } = route.params;
  const { presets } = useWorkoutStorage();

  const routine = useMemo(
    () => presets.find(p => p.id === routineId) ?? null,
    [presets, routineId],
  );
  const phases = useMemo(
    () => (routine ? buildPhaseQueue(routine) : []),
    [routine],
  );

  const { onPhaseChange, onTick } = useWorkoutAudio();
  const { snapshot, start, pause, resume, skip, stop } = useTimer({ onPhaseChange, onTick });

  const animWorkoutProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animWorkoutProgress, {
      toValue: snapshot.workoutProgress,
      duration: 950,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.workoutProgress]);

  // Start once phases are loadedtoda
  useEffect(() => {
    if (phases.length > 0 && snapshot.status === 'idle') {
      start(phases);
    }
  }, [phases, snapshot.status, start]);

  const handleStop = useCallback(() => {
    stop();
    navigation.goBack();
  }, [stop, navigation]);

  const handlePlayPause = useCallback(() => {
    if (snapshot.status === 'running') pause();
    else if (snapshot.status === 'paused') resume();
  }, [snapshot.status, pause, resume]);

  const colorKey: ColorKey = (snapshot.phase?.type ?? 'idle') as ColorKey;
  const colors = PHASE_COLORS[colorKey] ?? PHASE_COLORS.idle;

  const { mm, ss } = formatMMSS(snapshot.secondsLeft);
  const phase = snapshot.phase;
  const isDone = snapshot.status === 'done';
  const isIdle = snapshot.status === 'idle';
  const isRunning = snapshot.status === 'running';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={handleStop}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.topBtnText, { color: colors.label }]}>✕  Salir</Text>
          </TouchableOpacity>

          {!isDone && !isIdle && (
            <TouchableOpacity
              style={styles.topBtn}
              onPress={skip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.topBtnText, { color: colors.label }]}>Omitir  ▶▶</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        <View style={styles.center}>
          {isDone ? (
            <View style={styles.doneContainer}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={[styles.doneTitle, { color: colors.text }]}>¡Completado!</Text>
              <Text style={[styles.doneSubtitle, { color: colors.label }]}>Excelente trabajo</Text>
            </View>
          ) : (
            <CircularProgress
              size={240}
              strokeWidth={10}
              phaseId={phase?.id ?? ''}
              phaseDuration={phase?.duration ?? 0}
              secondsLeft={snapshot.secondsLeft}
              isPaused={snapshot.status === 'paused'}
              color={colors.accent}
              bgColor={colors.accent + '22'}
            >
              <View style={styles.timeContainer}>
                <View style={styles.timeRow}>
                  <Text style={[styles.timeDigits, { color: colors.text }]}>{mm}</Text>
                  <Text style={[styles.timeSep, { color: colors.accent }]}>:</Text>
                  <Text style={[styles.timeDigits, { color: colors.text }]}>{ss}</Text>
                </View>
                <Text style={[styles.phaseLabel, { color: colors.accent }]}>
                  {isIdle ? '...' : (PHASE_LABELS[colorKey] ?? colorKey.toUpperCase())}
                </Text>
              </View>
            </CircularProgress>
          )}
        </View>

        {/* Exercise info */}
        {phase && !isDone && (
          <View style={styles.infoBlock}>
            <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
              {phase.exerciseName}
            </Text>
            <View style={styles.badges}>
              {phase.totalSets > 0 && (
                <View style={[styles.badge, { borderColor: colors.accent + '55' }]}>
                  <Text style={[styles.badgeText, { color: colors.label }]}>
                    Serie {phase.setNumber}/{phase.totalSets}
                  </Text>
                </View>
              )}
              <View style={[styles.badge, { borderColor: colors.accent + '55' }]}>
                <Text style={[styles.badgeText, { color: colors.label }]}>
                  Ronda {phase.roundNumber}/{phase.totalRounds}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Overall progress bar */}
        {!isIdle && !isDone && (
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.accent + '22' }]}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.accent,
                    width: animWorkoutProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {isDone ? (
            <TouchableOpacity
              style={[styles.ctrlBtn, { backgroundColor: colors.accent }]}
              onPress={handleStop}
              activeOpacity={0.85}
            >
              <Text style={styles.ctrlBtnText}>Volver</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.ctrlBtn, { backgroundColor: colors.accent }]}
              onPress={handlePlayPause}
              activeOpacity={0.85}
            >
              <Text style={styles.ctrlBtnText}>
                {isRunning ? '⏸  Pausar' : '▶  Reanudar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topBtn: { padding: 8 },
  topBtnText: { fontSize: 14, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timeContainer: { alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeDigits: { fontSize: 56, fontWeight: '800', lineHeight: 64 },
  timeSep: { fontSize: 40, fontWeight: '300', marginHorizontal: 2, lineHeight: 64 },
  phaseLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 2, marginTop: 6 },
  doneContainer: { alignItems: 'center', gap: 12 },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 36, fontWeight: '800' },
  doneSubtitle: { fontSize: 16, fontWeight: '500' },
  infoBlock: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 16 },
  exerciseName: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 10 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  progressBarWrap: { paddingHorizontal: 32, marginBottom: 16 },
  progressBarBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  controls: { paddingHorizontal: 32, paddingBottom: 16 },
  ctrlBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctrlBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
});
