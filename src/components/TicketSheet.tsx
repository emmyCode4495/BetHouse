import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, FadeOut, LinearTransition, interpolate, useAnimatedReaction, useAnimatedStyle, useReducedMotion,
  useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTween } from '../hooks';
import { colors, font, MARGIN, naira } from '../theme';

export type Leg = { id: string; matchLabel: string; pickLabel: string; odds: number };
type Props = {
  legs: Leg[]; stake: number; setStake: (n: number) => void; remaining: number; balance: number;
  onRemove: (id: string) => void; onClose: () => void; onPlaced: () => void; onTopUp?: () => void;
};

const KNOB = 52;
const CHIPS = [500, 1000, 2000, 5000];

function Zigzag({ width, flip }: { width: number; flip?: boolean }) {
  const h = 7;
  const teeth = Math.round(width / 12);
  const w = width / teeth;
  let d = `M0 ${flip ? 0 : h}`;
  for (let i = 0; i < teeth; i++) d += ` L${i * w + w / 2} ${flip ? h : 0} L${(i + 1) * w} ${flip ? 0 : h}`;
  return (
    <Svg width={width} height={h} style={{ marginVertical: -0.5 }}>
      <Path d={d} fill={colors.paper} />
    </Svg>
  );
}

const Dashed = () => <View style={styles.dashed} />;

export function TicketSheet({ legs, stake, setStake, remaining, balance, onRemove, onClose, onPlaced, onTopUp }: Props) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const ticketW = width - MARGIN * 2;
  const ticketNo = useMemo(() => {
    const n = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    return `No. ${n.slice(0, 4)} ${n.slice(4)}`;
  }, []);

  const y = useSharedValue(height);
  const x = useSharedValue(0);
  const maxX = useSharedValue(1);
  const tear = useSharedValue(0);
  const stamp = useSharedValue(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    y.value = reduce ? withTiming(0, { duration: 120 }) : withSpring(0, { damping: 20, stiffness: 170, mass: 0.9 });
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [y, reduce]);

  const total = legs.reduce((a, l) => a * l.odds, 1);
  const shownReturn = useTween(stake * total);
  const overLimit = stake > remaining;
  const overBalance = stake > balance;
  const canPlace = legs.length > 0 && !overLimit && !overBalance && !done;

  const closeSheet = useCallback(() => {
    y.value = withTiming(height, { duration: 240, easing: Easing.in(Easing.cubic) }, (fin) => {
      if (fin) scheduleOnRN(onClose);
    });
  }, [height, onClose, y]);

  useEffect(() => { if (legs.length === 0 && !done) closeSheet(); }, [legs.length, done, closeSheet]);

  const finish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
    timer.current = setTimeout(onPlaced, 1600);
  }, [onPlaced]);
  const ratchet = useCallback(() => { Haptics.selectionAsync(); }, []);

  // Tearing along the perforation clicks like paper: one haptic tick per 1/12th of the drag.
  useAnimatedReaction(
    () => Math.floor((x.value / maxX.value) * 12),
    (cur, prev) => { if (prev !== null && cur > prev && cur < 12) scheduleOnRN(ratchet); },
  );

  const dismiss = Gesture.Pan()
    .onUpdate((e) => { y.value = Math.max(0, e.translationY); })
    .onEnd((e) => {
      if (e.translationY > 140 || e.velocityY > 900) {
        y.value = withTiming(height, { duration: 220 }, (fin) => { if (fin) scheduleOnRN(onClose); });
      } else {
        y.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const drag = Gesture.Pan()
    .enabled(canPlace)
    .onUpdate((e) => { x.value = Math.min(Math.max(e.translationX, 0), maxX.value); })
    .onEnd(() => {
      if (x.value > maxX.value * 0.88) {
        x.value = withTiming(maxX.value, { duration: 120 });
        tear.value = withDelay(80, withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
        stamp.value = withDelay(380, withSpring(1, { damping: 9, stiffness: 170, mass: 0.7 }));
        scheduleOnRN(finish);
      } else {
        x.value = withSpring(0, { damping: 16, stiffness: 220 });
      }
    });

  const dim = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, height], [1, 0]) }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fill = useAnimatedStyle(() => ({ width: x.value + KNOB + 8 }));
  const hint = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, maxX.value * 0.35], [1, 0], 'clamp') }));
  const stub = useAnimatedStyle(() => ({
    opacity: 1 - tear.value * 0.9,
    transform: [
      { translateX: tear.value * 36 }, { translateY: tear.value * 110 }, { rotate: `${tear.value * 8}deg` },
    ],
  }));
  const stampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(stamp.value * 1.5, 1),
    transform: [{ rotate: '-12deg' }, { scale: interpolate(stamp.value, [0, 1], [2.4, 1]) }],
  }));

  const message = overLimit
    ? 'This stake is over your daily limit. Lower it or change your limit in Wallet.'
    : overBalance
      ? 'Your balance is lower than this stake.'
      : `Daily limit left: ${naira(remaining)}. 18+, bet within your means.`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} accessibilityLabel="Close bet slip" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: height * 0.92 }, sheet]}>
        <GestureDetector gesture={dismiss}>
          <View style={styles.gripArea}><View style={styles.grip} /></View>
        </GestureDetector>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ alignItems: 'center' }}>
          <View style={{ width: ticketW }}>
            <Zigzag width={ticketW} />
            <View style={styles.body}>
              <View style={styles.headRow}>
                <Text style={styles.title}>Bet slip</Text>
                <Text style={styles.small}>{ticketNo}</Text>
              </View>
              <Text style={styles.small}>{legs.length > 1 ? `Accumulator, ${legs.length} picks` : 'Single'}</Text>
              <Dashed />

              {legs.map((l) => (
                <Animated.View key={l.id} layout={LinearTransition} exiting={FadeOut.duration(160)} style={styles.leg}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.legMatch}>{l.matchLabel}</Text>
                    <Text style={styles.legPick}>{l.pickLabel}</Text>
                  </View>
                  <Text style={styles.legOdds}>{l.odds.toFixed(2)}</Text>
                  <Pressable
                    onPress={() => onRemove(l.id)} hitSlop={6} style={styles.remove}
                    accessibilityRole="button" accessibilityLabel={`Remove ${l.pickLabel}`}
                  >
                    <Ionicons name="close" size={20} color={colors.inkSoft} />
                  </Pressable>
                </Animated.View>
              ))}

              <Dashed />
              <View style={styles.headRow}>
                <Text style={styles.small}>Total odds</Text>
                <Text style={styles.totalOdds}>{total.toFixed(2)}</Text>
              </View>

              <View style={styles.stakeRow}>
                <Pressable style={styles.step} onPress={() => setStake(Math.max(100, stake - 500))} accessibilityLabel="Lower stake">
                  <Ionicons name="remove" size={20} color={colors.ink} />
                </Pressable>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.small}>Stake</Text>
                  <Text style={styles.stake}>{naira(stake)}</Text>
                </View>
                <Pressable style={styles.step} onPress={() => setStake(stake + 500)} accessibilityLabel="Raise stake">
                  <Ionicons name="add" size={20} color={colors.ink} />
                </Pressable>
              </View>
              <View style={styles.chips}>
                {CHIPS.map((c) => (
                  <Pressable
                    key={c} onPress={() => { Haptics.selectionAsync(); setStake(c); }}
                    style={[styles.chip, stake === c && styles.chipOn]} accessibilityRole="button"
                    accessibilityState={{ selected: stake === c }}
                  >
                    <Text style={[styles.chipText, stake === c && { color: colors.paper }]}>{naira(c)}</Text>
                  </Pressable>
                ))}
              </View>

              <Dashed />
              <Text style={styles.small}>Potential return</Text>
              <Text style={styles.ret}>{naira(shownReturn)}</Text>
              <Text style={[styles.note, (overLimit || overBalance) && { color: '#B3263E' }]}>{message}</Text>
              {overBalance && onTopUp && (
                <Pressable onPress={onTopUp} style={styles.link} accessibilityRole="button" accessibilityLabel="Top up wallet">
                  <Text style={styles.linkText}>Top up wallet</Text>
                </Pressable>
              )}

              <Animated.View pointerEvents="none" style={[styles.stamp, stampStyle]}>
                <Text style={styles.stampText}>PLACED</Text>
                <Text style={styles.stampSub}>{`${naira(stake)} on ${legs.length} ${legs.length > 1 ? 'picks' : 'pick'}`}</Text>
              </Animated.View>
            </View>

            <View style={styles.perf}>
              <View style={[styles.notch, { left: -11 }]} />
              <View style={styles.perfLine} />
              <View style={[styles.notch, { right: -11 }]} />
            </View>

            <Animated.View style={stub}>
              <View style={styles.stubBody}>
                <View
                  style={[styles.track, !canPlace && { opacity: 0.45 }]}
                  onLayout={(e) => { maxX.value = e.nativeEvent.layout.width - KNOB - 8; }}
                >
                  <Animated.View style={[styles.trackFill, fill]} />
                  <Animated.Text style={[styles.trackText, hint]}>{`Swipe to tear and place ${naira(stake)}`}</Animated.Text>
                  <GestureDetector gesture={drag}>
                    <Animated.View
                      style={[styles.knob, knob]} accessible accessibilityRole="button"
                      accessibilityLabel={`Place ${naira(stake)} bet`}
                    >
                      <Ionicons name="arrow-forward" size={22} color={colors.gold} />
                    </Animated.View>
                  </GestureDetector>
                </View>
              </View>
              <Zigzag width={ticketW} flip />
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const mono = font.mono;
const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(4,6,20,0.74)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.sheet,
    borderTopLeftRadius: 32, borderTopRightRadius: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)',
  },
  gripArea: { height: 32, alignItems: 'center', justifyContent: 'center' },
  grip: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  body: { backgroundColor: colors.paper, paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: font.monoMed, fontSize: 16, color: colors.ink },
  small: { fontFamily: mono, fontSize: 12.5, color: colors.inkSoft },
  dashed: { borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9BFD1', marginVertical: 2 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  legMatch: { fontFamily: mono, fontSize: 12.5, color: colors.inkSoft },
  legPick: { fontFamily: font.semi, fontSize: 15.5, color: colors.ink, marginTop: 2 },
  legOdds: { fontFamily: font.monoMed, fontSize: 16, color: colors.ink },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  totalOdds: { fontFamily: font.monoMed, fontSize: 17, color: colors.ink },
  stakeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  step: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  stake: { fontFamily: font.bold, fontSize: 26, color: colors.ink },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#B9BFD1',
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: font.monoMed, fontSize: 13, color: colors.ink },
  ret: { fontFamily: font.bold, fontSize: 34, color: colors.ink },
  note: { fontFamily: mono, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: font.monoMed, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
  stamp: {
    position: 'absolute', right: 18, top: 70, borderWidth: 4, borderColor: colors.winDeep, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center', backgroundColor: 'rgba(241,243,248,0.9)',
  },
  stampText: { fontFamily: font.monoMed, fontSize: 30, letterSpacing: 4, color: colors.winDeep },
  stampSub: { fontFamily: mono, fontSize: 12, color: colors.winDeep },
  perf: { height: 22, backgroundColor: colors.paper, justifyContent: 'center' },
  perfLine: { borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#B9BFD1', marginHorizontal: 16 },
  notch: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: colors.sheet },
  stubBody: { backgroundColor: colors.paper, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 },
  track: { height: KNOB + 8, borderRadius: (KNOB + 8) / 2, backgroundColor: colors.paperEdge, justifyContent: 'center', overflow: 'hidden' },
  trackFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.gold, borderRadius: (KNOB + 8) / 2 },
  trackText: { textAlign: 'center', fontFamily: font.semi, fontSize: 14.5, color: colors.ink, paddingLeft: KNOB },
  knob: {
    position: 'absolute', left: 4, top: 4, width: KNOB, height: KNOB, borderRadius: KNOB / 2,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
  },
});
