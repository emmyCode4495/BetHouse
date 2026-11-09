import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

type OrbProps = { id: string; color: string; size: number; x: number; y: number; dx: number; dy: number; dur: number };

function Orb({ id, color, size, x, y, dx, dy, dur }: OrbProps) {
  const t = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, dur, t]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [0, dx]) },
      { translateY: interpolate(t.value, [0, 1], [0, dy]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.18]) },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.85" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** Night stadium: three drifting floodlight glows. Glass needs this behind it to mean anything. */
export function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#0A0E2A', '#101552', '#0A0E2A']} style={StyleSheet.absoluteFill} />
      <Orb id="o1" color={colors.violet} size={520} x={-190} y={-120} dx={70} dy={90} dur={9000} />
      <Orb id="o2" color={colors.magenta} size={440} x={150} y={260} dx={-80} dy={60} dur={11000} />
      <Orb id="o3" color={colors.dusk} size={560} x={-220} y={540} dx={90} dy={-70} dur={13000} />
    </View>
  );
}
