import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  size: number;
  strokeWidth: number;
  /** Changes every phase — triggers a fresh animation from 0→100% */
  phaseId: string;
  /** Total phase duration in seconds */
  phaseDuration: number;
  /** Remaining seconds — used to sync when resuming from pause */
  secondsLeft: number;
  isPaused: boolean;
  color: string;
  bgColor?: string;
  children?: React.ReactNode;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularProgress({
  size, strokeWidth,
  phaseId, phaseDuration, secondsLeft, isPaused,
  color, bgColor = '#ffffff18', children,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const animOffset = useRef(new Animated.Value(circumference)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // New phase → snap to empty, run full animation to filled
  useEffect(() => {
    if (phaseDuration <= 0) {
      animRef.current?.stop();
      animOffset.setValue(circumference);
      return;
    }
    animRef.current?.stop();
    animOffset.setValue(circumference);
    animRef.current = Animated.timing(animOffset, {
      toValue: 0,
      duration: phaseDuration * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animRef.current.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseId]);

  // Pause / resume
  useEffect(() => {
    if (isPaused) {
      animRef.current?.stop();
    } else if (secondsLeft > 0) {
      animRef.current?.stop();
      animRef.current = Animated.timing(animOffset, {
        toValue: 0,
        duration: secondsLeft * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      animRef.current.start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx} cy={cy} r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={animOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {children}
      </View>
    </View>
  );
}
