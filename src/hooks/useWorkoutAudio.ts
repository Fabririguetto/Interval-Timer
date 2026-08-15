import { useEffect, useCallback } from 'react';
import { useAudioPlayer, setIsAudioActiveAsync, AudioPlayer } from 'expo-audio';
import type { IntervalPhase } from '../types/workout';

const SRC = require('../../assets/sounds/beep-rest.mp3');

async function playBeeps(player: AudioPlayer, count: number) {
  for (let i = 0; i < count; i++) {
    await player.seekTo(0);
    player.play();
    if (i < count - 1) {
      await new Promise<void>(resolve => setTimeout(resolve, 280));
    }
  }
}

export function useWorkoutAudio() {
  const player = useAudioPlayer(SRC);

  useEffect(() => {
    setIsAudioActiveAsync(true);
  }, []);

  const onPhaseChange = useCallback((phase: IntervalPhase) => {
    switch (phase.type) {
      case 'prepare':
        playBeeps(player, 1);
        break;
      case 'work':
        playBeeps(player, 1);
        break;
      case 'rest':
        playBeeps(player, 2);
        break;
      case 'transition':
        playBeeps(player, 2);
        break;
      case 'rest_between_rounds':
        playBeeps(player, 3);
        break;
    }
  }, [player]);

  // Countdown: 1 beep por segundo en los últimos 3s de trabajo
  const onTick = useCallback((secondsLeft: number, phase: IntervalPhase) => {
    if (phase.type === 'work' && secondsLeft <= 3 && secondsLeft > 0) {
      playBeeps(player, 1);
    }
  }, [player]);

  return { onPhaseChange, onTick };
}
