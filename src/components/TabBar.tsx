import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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

export function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barW = width - MARGIN * 2;
  const tabW = (barW - 12) / TABS.length;
  const x = useSharedValue(0);
  const index = TABS.findIndex((t) => t.key === active);

  useEffect(() => {
    x.value = withSpring(index * tabW, { damping: 15, stiffness: 190, mass: 0.8 });
  }, [index, tabW, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 8) + 4 }]}>
      <Glass radius={32} intensity={50} style={{ width: barW, height: TAB_H }}>
        <Animated.View style={[styles.pill, { width: tabW }, pill]} />
        <View style={styles.row}>
          {TABS.map((t) => {
            const on = t.key === active;
            return (
              <Pressable
                key={t.key} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}
                onPress={() => { if (!on) { Haptics.selectionAsync(); onChange(t.key); } }}
              >
                <Ionicons name={t.icon} size={22} color={on ? colors.gold : colors.textMute} />
                <Text style={[styles.label, { color: on ? colors.gold : colors.textMute }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: MARGIN },
  row: { flexDirection: 'row', padding: 6, height: TAB_H },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: font.semi, fontSize: 11 },
  pill: {
    position: 'absolute', left: 6, top: 6, height: TAB_H - 14, borderRadius: 26,
    backgroundColor: 'rgba(255,194,75,0.16)', borderWidth: 1, borderColor: 'rgba(255,194,75,0.45)',
  },
});
