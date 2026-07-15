import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface SvgIconProps {
  name: string;
  color?: string;
  size?: number;
}

export default function SvgIcon({ name, color = '#1E293B', size = 24 }: SvgIconProps) {
  const cleanName = name.toLowerCase();

  if (cleanName.includes('electric') || cleanName.includes('power')) {
    // Electrician / Bolt icon
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color + '33'} />
      </Svg>
    );
  }

  if (cleanName.includes('plumb') || cleanName.includes('leak') || cleanName.includes('water')) {
    // Plumber / Water Drop / Tap icon
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color + '33'} />
      </Svg>
    );
  }

  if (cleanName.includes('clean') || cleanName.includes('wash') || cleanName.includes('dust')) {
    // Cleaner / Sparkles icon
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" fill={color + '33'} />
        <Circle cx={6} cy={5} r={1.5} fill={color} />
        <Circle cx={18} cy={18} r={1} fill={color} />
      </Svg>
    );
  }

  if (cleanName.includes('carpent') || cleanName.includes('wood') || cleanName.includes('furnit')) {
    // Carpenter / Hammer / Rule / Square icon
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l4-4a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-4 4z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color + '33'} />
        <Path d="M14 7l-9 9V20h4l9-9-4-4z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M18 3l3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  if (cleanName.includes('ac') || cleanName.includes('repair') || cleanName.includes('cool') || cleanName.includes('fan')) {
    // Fan / Wind / Snowflake icon
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
        <Path d="M12 2a10 10 0 0 1 2 6.5A2.5 2.5 0 0 1 12 11a2.5 2.5 0 0 1-2-2.5A10 10 0 0 1 12 2z" stroke={color} strokeWidth={1.5} fill={color + '22'} />
        <Path d="M12 22a10 10 0 0 1-2-6.5 2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1 2 2.5 10 10 0 0 1-2 6.5z" stroke={color} strokeWidth={1.5} fill={color + '22'} />
        <Path d="M2 12a10 10 0 0 1 6.5-2 2.5 2.5 0 0 1 2.5 2 2.5 2.5 0 0 1-2.5 2A10 10 0 0 1 2 12z" stroke={color} strokeWidth={1.5} fill={color + '22'} />
        <Path d="M22 12a10 10 0 0 1-6.5 2 2.5 2.5 0 0 1-2.5-2 2.5 2.5 0 0 1 2.5-2A10 10 0 0 1 22 12z" stroke={color} strokeWidth={1.5} fill={color + '22'} />
        <Circle cx={12} cy={12} r={1.5} fill={color} />
      </Svg>
    );
  }

  // Default / Services Briefcase icon
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={2} fill={color + '15'} />
      <Path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
