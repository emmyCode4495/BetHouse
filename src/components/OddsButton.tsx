import { memo, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, font } from '../theme';

type Props = {
  label: string; value: number; selected: boolean; a11y: string; onPress: () => void;
  flashN?: number; flashDir?: 1 | -1; compact?: boolean;
};

function OddsButtonBase({ label, value, selected, a11y, onPress, flashN, flashDir, compact }: Props) {
  const sel = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(0);
  const flash = useSharedValue(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    sel.value = reduce ? (selected ? 1 : 0) : withSpring(selected ? 1 : 0, { damping: 13, stiffness: 260 });
  }, [selected, reduce, sel]);

  // A price just moved: tint the number and show a small arrow, then settle.
  useEffect(() => {
    if (flashN === undefined || flashDir === undefined) return;
    flash.value = withSequence(withTiming(flashDir, { duration: 120 }), withTiming(0, { duration: 1400 }));
  }, [flashN, flashDir, flash]);

  const box = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.05 }],
    backgroundColor: interpolateColor(sel.value, [0, 1], ['rgba(255,255,255,0.10)', colors.gold]),
    borderColor: interpolateColor(sel.value, [0, 1], ['rgba(255,255,255,0.20)', colors.gold]),
  }));
  const lab = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.textMute, 'rgba(21,26,51,0.78)']),
  }));
  const num = useAnimatedStyle(() => ({
    color: interpolateColor(
      sel.value, [0, 1],
      [interpolateColor(flash.value, [-1, 0, 1], [colors.loss, colors.text, colors.win]), colors.ink],
    ),
  }));
  const up = useAnimatedStyle(() => ({
    opacity: Math.max(flash.value, 0) * (1 - sel.value),
    transform: [{ translateY: -flash.value * 3 }],
  }));
  const down = useAnimatedStyle(() => ({
    opacity: Math.max(-flash.value, 0) * (1 - sel.value),
    transform: [{ translateY: -flash.value * 3 }],
  }));

  return (
    <Pressable
      style={styles.hit}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      onPressIn={() => { press.value = withTiming(1, { duration: 90 }); }}
      onPressOut={() => { press.value = withSpring(0, { damping: 14, stiffness: 300 }); }}
      onPress={() => {
        Haptics.impactAsync(selected ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
    >
      <Animated.View style={[styles.box, compact && styles.compact, box]}>
        <Animated.Text numberOfLines={1} style={[styles.label, lab]}>{label}</Animated.Text>
        <Animated.Text style={[styles.value, num]}>{value.toFixed(2)}</Animated.Text>
        <Animated.Text style={[styles.arrow, { color: colors.win }, up]}>▲</Animated.Text>
        <Animated.Text style={[styles.arrow, { color: colors.loss }, down]}>▼</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export const OddsButton = memo(OddsButtonBase);

const styles = StyleSheet.create({
  hit: { flex: 1 },
  box: { height: 58, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  compact: { height: 52 },
  label: { fontFamily: font.regular, fontSize: 12 },
  value: { fontFamily: font.bold, fontSize: 17, fontVariant: ['tabular-nums'] },
  arrow: { position: 'absolute', top: 6, right: 9, fontSize: 8 },
});
