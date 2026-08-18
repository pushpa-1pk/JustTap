import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CountdownRingProps {
  expiresAtTimestamp: number;
  totalDurationSeconds: number;
  onExpire: () => void;
  size?: number;
  strokeWidth?: number;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  expiresAtTimestamp,
  totalDurationSeconds,
  onExpire,
  size = 120,
  strokeWidth = 6,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const updateTimer = () => {
      const diffMs = expiresAtTimestamp - Date.now();
      const diffSeconds = Math.max(0, Math.ceil(diffMs / 1000));
      
      setTimeLeft(diffSeconds);

      if (diffMs <= 0) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [expiresAtTimestamp, onExpire]);

  const progress = Math.min(1, Math.max(0, timeLeft / totalDurationSeconds));
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={timeLeft <= 5 ? '#DC2626' : '#16A34A'}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.timerText}>{timeLeft}</Text>
        <Text style={styles.subText}>secs</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  subText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: -2,
  },
});
