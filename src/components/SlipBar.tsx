import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, MARGIN } from '../theme';
import { TAB_H } from './TabBar';

type Props = { count: number; totalOdds: number; onOpen: () => void };

export function SlipBar({ count, totalOdds, onOpen }: Props) {
  const insets = useSafeAreaInsets();
  const bump = useSharedValue(1);
  const press = useSharedValue(1);

  useEffect(() => {
    if (count > 0) bump.value = withSequence(withTiming(1.3, { duration: 90 }), withSpring(1, { damping: 8 }));
  }, [count, bump]);
  const badge = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const body = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 8) + 4 + TAB_H + 12 }]}>
      {count > 0 && (
        <Animated.View entering={SlideInDown.springify().damping(17)} exiting={SlideOutDown.duration(180)} style={body}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open bet slip, ${count} picks, total odds ${totalOdds.toFixed(2)}`}
            onPressIn={() => { press.value = withTiming(0.97, { duration: 80 }); }}
            onPressOut={() => { press.value = withSpring(1); }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpen(); }}
          >
            <LinearGradient colors={[colors.gold, colors.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bar}>
              <Animated.View style={[styles.badge, badge]}>
                <Text style={styles.badgeText}>{count}</Text>
              </Animated.View>
              <Text style={styles.title}>Bet slip</Text>
              <View style={styles.spacer} />
              <Text style={styles.odds}>{totalOdds.toFixed(2)}</Text>
              <Text style={styles.oddsLabel}>total odds</Text>
              <Ionicons name="chevron-up" size={20} color={colors.ink} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: MARGIN, right: MARGIN },
  bar: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.bold, fontSize: 14, color: colors.gold },
  title: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  spacer: { flex: 1 },
  odds: { fontFamily: font.bold, fontSize: 18, color: colors.ink, fontVariant: ['tabular-nums'] },
  oddsLabel: { fontFamily: font.regular, fontSize: 12, color: 'rgba(21,26,51,0.75)' },
});
