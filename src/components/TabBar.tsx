import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation, SharedValue, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, MARGIN } from '../theme';
import { Glass } from './Glass';

export type TabKey = 'home' | 'live' | 'bets' | 'wallet';
const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline' },
  { key: 'live', label: 'Live', icon: 'radio-outline' },
  { key: 'bets', label: 'My bets', icon: 'receipt-outline' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
];
export const TAB_H = 64;
// Quick and critically damped: no overshoot, so the bubble never trails the finger or the label.
const MOVE = { damping: 26, stiffness: 320, mass: 0.7 };

type ItemProps = {
  t: (typeof TABS)[number]; i: number; tabW: number; x: SharedValue<number>; active: boolean; onPress: () => void;
};

/** Icon and label colour are driven by the bubble's position, so they light up as it arrives. */
function TabItem({ t, i, tabW, x, active, onPress }: ItemProps) {
  const range = [(i - 1) * tabW, i * tabW, (i + 1) * tabW];
  const goldIcon = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, range, [0, 1, 0], Extrapolation.CLAMP),
  }));
  const label = useAnimatedStyle(() => ({
    color: interpolateColor(x.value, range, [colors.textMute, colors.gold, colors.textMute]),
  }));
  return (
    <Pressable style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name={t.icon} size={22} color={colors.textMute} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, goldIcon]}>
          <Ionicons name={t.icon} size={22} color={colors.gold} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.label, label]}>{t.label}</Animated.Text>
    </Pressable>
  );
}

export function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barW = width - MARGIN * 2;
  const tabW = (barW - 12) / TABS.length;
  const index = TABS.findIndex((t) => t.key === active);
  const x = useSharedValue(index * tabW);

  useEffect(() => {
    x.value = withSpring(index * tabW, MOVE);
  }, [index, tabW, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 8) + 4 }]}>
      <Glass radius={32} intensity={50} style={{ width: barW, height: TAB_H }}>
        <Animated.View style={[styles.pill, { width: tabW }, pill]} />
        <View style={styles.row}>
          {TABS.map((t, i) => (
            <TabItem
              key={t.key} t={t} i={i} tabW={tabW} x={x} active={t.key === active}
              onPress={() => { if (t.key !== active) { Haptics.selectionAsync(); onChange(t.key); } }}
            />
          ))}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: MARGIN },
  row: { flexDirection: 'row', padding: 6, height: TAB_H },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  icon: { width: 22, height: 22 },
  label: { fontFamily: font.semi, fontSize: 11 },
  pill: {
    position: 'absolute', left: 6, top: 6, height: TAB_H - 14, borderRadius: 26,
    backgroundColor: 'rgba(255,194,75,0.16)', borderWidth: 1, borderColor: 'rgba(255,194,75,0.45)',
  },
});
