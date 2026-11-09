import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const BAND = 56;

/** Alternating mown stripes that creep slowly, like the camera panning along the touchline. */
function Stripes({ width, height }: { width: number; height: number }) {
  let n = Math.ceil(height / BAND) + 3;
  if (n % 2) n += 1;
  const t = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.linear }), -1, false);
  }, [reduce, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -t.value * BAND * 2 }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, style]}>
      <Svg width={width} height={n * BAND}>
        {Array.from({ length: n / 2 }, (_, i) => (
          <Rect key={i} x={0} y={(i * 2 + 1) * BAND} width={width} height={BAND} fill="rgba(255,255,255,0.05)" />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Static pitch markings: halfway line, centre circle, both penalty boxes. */
function Markings({ width, height }: { width: number; height: number }) {
  const cy = height * 0.42;
  const stroke = 'rgba(255,255,255,0.13)';
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Line x1={0} y1={cy} x2={width} y2={cy} stroke={stroke} strokeWidth={2} />
      <Circle cx={width / 2} cy={cy} r={width * 0.27} stroke={stroke} strokeWidth={2} fill="none" />
      <Circle cx={width / 2} cy={cy} r={4} fill={stroke} />
      <Rect x={width * 0.16} y={-4} width={width * 0.68} height={height * 0.11} stroke={stroke} strokeWidth={2} fill="none" />
      <Rect x={width * 0.16} y={height * 0.89} width={width * 0.68} height={height * 0.11 + 4} stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}

type GlowProps = { id: string; color: string; size: number; x: number; y: number; peak: number; dx?: number; dy?: number; dur?: number };

function Glow({ id, color, size, x, y, peak, dx = 0, dy = 0, dur = 9000 }: GlowProps) {
  const t = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, dur, t]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.8, 1]),
    transform: [
      { translateX: interpolate(t.value, [0, 1], [0, dx]) },
      { translateY: interpolate(t.value, [0, 1], [0, dy]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.1]) },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={peak} />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** A pitch at night under floodlights. Glass needs this behind it to mean anything. */
export function Backdrop() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[colors.pitchDeep, colors.pitch, '#06180F']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Stripes width={width} height={height} />
      <Markings width={width} height={height} />
      <Glow id="fl-left" color={colors.floodlight} size={620} x={-250} y={-260} peak={0.42} dx={30} dy={20} dur={10000} />
      <Glow id="fl-right" color={colors.floodlight} size={560} x={width - 330} y={-240} peak={0.36} dx={-26} dy={24} dur={12000} />
      <Glow id="em" color={colors.emerald} size={640} x={-180} y={height - 360} peak={0.34} dx={60} dy={-40} dur={14000} />
      {/* keep text contrast: darken the top edge and the area behind the tab bar */}
      <LinearGradient
        colors={['rgba(2,10,7,0.35)', 'rgba(2,10,7,0)', 'rgba(2,10,7,0.55)']}
        locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none"
      />
    </View>
  );
}
