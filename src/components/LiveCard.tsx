import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation, SharedValue, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Market, Match, pickLabel, shortLabel } from '../data';
import type { Tick } from '../hooks';
import { colors, font } from '../theme';
import { Crest } from './Crest';
import { Glass } from './Glass';
import { OddsButton } from './OddsButton';

export const CARD_W = 296;
export const GAP = 14;
export const SNAP = CARD_W + GAP;
const MARKETS: Market[] = ['1', 'X', '2'];

function LiveDot() {
  const o = useSharedValue(1);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withSequence(withTiming(0.25, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
  }, [reduce, o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, s]} />;
}

type Props = {
  m: Match; odds: Record<Market, number>; pick?: Market; tick: Tick; index: number;
  scrollX: SharedValue<number>; onPick: (id: string, mk: Market) => void;
};

export function LiveCard({ m, odds, pick, tick, index, scrollX, onPick }: Props) {
  const input = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];
  const card = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0.55, 1, 0.55], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(scrollX.value, input, [0.92, 1, 0.92], Extrapolation.CLAMP) }],
  }));
  // The score block drifts slightly against the card so the swipe feels layered.
  const score = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(scrollX.value, input, [26, 0, -26], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={[{ width: CARD_W }, card]}>
      <Glass blur={false} radius={28}>
        <LinearGradient
          colors={[`${m.home.bg}55`, 'transparent', `${m.away.bg}55`]}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill} pointerEvents="none"
        />
        <View style={styles.pad}>
          <View style={styles.top}>
            <View style={styles.pill}>
              <LiveDot />
              <Text style={styles.pillText}>{`Live ${m.minute}'`}</Text>
            </View>
            <Text style={styles.league}>{m.league}</Text>
          </View>
          <Animated.View style={[styles.mid, score]}>
            <View style={styles.side}><Crest team={m.home} size={44} /><Text style={styles.sideName}>{m.home.name}</Text></View>
            <Text style={styles.score}>{`${m.score?.[0]} – ${m.score?.[1]}`}</Text>
            <View style={styles.side}><Crest team={m.away} size={44} /><Text style={styles.sideName}>{m.away.name}</Text></View>
          </Animated.View>
          <View style={styles.odds}>
            {MARKETS.map((mk) => {
              const hit = tick.key === `${m.id}:${mk}`;
              return (
                <OddsButton
                  key={mk} compact label={shortLabel(m, mk)} value={odds[mk]} selected={pick === mk}
                  a11y={`${pickLabel(m, mk)}, odds ${odds[mk].toFixed(2)}`}
                  flashN={hit ? tick.n : undefined} flashDir={hit ? tick.dir : undefined}
                  onPress={() => onPick(m.id, mk)}
                />
              );
            })}
          </View>
        </View>
      </Glass>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,77,94,0.18)', borderWidth: 1, borderColor: 'rgba(255,77,94,0.55)',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  pillText: { fontFamily: font.semi, fontSize: 12, color: '#FFD3D8' },
  league: { fontFamily: font.regular, fontSize: 12.5, color: colors.textMute },
  mid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { alignItems: 'center', gap: 6, width: 84 },
  sideName: { fontFamily: font.semi, fontSize: 13, color: colors.text },
  score: { fontFamily: font.bold, fontSize: 36, color: colors.text, fontVariant: ['tabular-nums'] },
  odds: { flexDirection: 'row', gap: 8 },
});
