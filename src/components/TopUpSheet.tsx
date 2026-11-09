import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, FadeIn, interpolate, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTween } from '../hooks';
import { colors, font, MARGIN, naira } from '../theme';

export type PayMethod = 'card' | 'bank' | 'ussd';
const METHODS: { key: PayMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'card', label: 'Card', icon: 'card-outline' },
  { key: 'bank', label: 'Bank transfer', icon: 'business-outline' },
  { key: 'ussd', label: 'USSD', icon: 'keypad-outline' },
];
const MIN = 100;
const MAX = 100000;
const CHIPS = [1000, 2000, 5000, 10000];
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'] as const;
const ROWS = [KEYS.slice(0, 3), KEYS.slice(3, 6), KEYS.slice(6, 9), KEYS.slice(9, 12)];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

function Spinner() {
  const r = useSharedValue(0);
  useEffect(() => { r.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1); }, [r]);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 360}deg` }] }));
  return (
    <Animated.View style={s}>
      <Svg width={72} height={72} viewBox="0 0 72 72">
        <Circle cx={36} cy={36} r={30} stroke="rgba(255,255,255,0.15)" strokeWidth={6} fill="none" />
        <Circle cx={36} cy={36} r={30} stroke={colors.gold} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray="50 140" />
      </Svg>
    </Animated.View>
  );
}

function Tick() {
  const ring = useSharedValue(0);
  const check = useSharedValue(0);
  useEffect(() => {
    ring.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    check.value = withDelay(350, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, [ring, check]);
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: 213.6 * (1 - ring.value) }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: 70 * (1 - check.value) }));
  return (
    <Svg width={96} height={96} viewBox="0 0 96 96">
      <AnimatedCircle
        cx={48} cy={48} r={34} stroke={colors.win} strokeWidth={6} fill="none" strokeLinecap="round"
        strokeDasharray="213.6" animatedProps={ringProps} originX={48} originY={48} rotation={-90}
      />
      <AnimatedPath
        d="M32 49 L44 61 L66 36" stroke={colors.win} strokeWidth={6} fill="none"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray="70" animatedProps={checkProps}
      />
    </Svg>
  );
}

type Props = { balance: number; onClose: () => void; onSuccess: (amount: number, method: PayMethod) => void };

export function TopUpSheet({ balance, onClose, onSuccess }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('card');
  const [phase, setPhase] = useState<'input' | 'processing' | 'success'>('input');
  const [paid, setPaid] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const y = useSharedValue(height);

  useEffect(() => {
    y.value = reduce ? withTiming(0, { duration: 120 }) : withSpring(0, { damping: 20, stiffness: 170, mass: 0.9 });
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, [y, reduce]);

  const value = Number(amount || '0');
  const valid = value >= MIN && value <= MAX;
  const tooMuch = value > MAX;
  const shownBalance = useTween(balance);

  const closeSheet = useCallback(() => {
    y.value = withTiming(height, { duration: 240, easing: Easing.in(Easing.cubic) }, (fin) => {
      if (fin) scheduleOnRN(onClose);
    });
  }, [height, onClose, y]);

  const press = (k: (typeof KEYS)[number]) => {
    if (phase !== 'input') return;
    Haptics.selectionAsync();
    if (k === 'del') return setAmount((a) => a.slice(0, -1));
    setAmount((a) => {
      const next = (a + k).replace(/^0+/, '');
      return next.length > 6 ? a : next;
    });
  };

  const pay = () => {
    if (!valid || phase !== 'input') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('processing');
    // Replace this timer with your payment provider call (Paystack, Flutterwave, ...).
    timers.current.push(setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPaid(value);
      onSuccess(value, method);
      setPhase('success');
      timers.current.push(setTimeout(closeSheet, 1900));
    }, 1600));
  };

  const dismiss = Gesture.Pan()
    .enabled(phase === 'input')
    .onUpdate((e) => { y.value = Math.max(0, e.translationY); })
    .onEnd((e) => {
      if (e.translationY > 140 || e.velocityY > 900) {
        y.value = withTiming(height, { duration: 220 }, (fin) => { if (fin) scheduleOnRN(onClose); });
      } else {
        y.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const dim = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, height], [1, 0]) }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dim]}>
        <Pressable
          style={StyleSheet.absoluteFill} accessibilityLabel="Close top up"
          onPress={() => { if (phase === 'input') closeSheet(); }}
        />
      </Animated.View>

      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: height * 0.94 }, sheet]}>
        <GestureDetector gesture={dismiss}>
          <View style={styles.gripArea}><View style={styles.grip} /></View>
        </GestureDetector>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Top up</Text>
            <Text style={styles.meta}>{`Balance ${naira(shownBalance)}`}</Text>
          </View>

          <View style={styles.amountBox}>
            <Text style={[styles.amount, !amount && { color: colors.textMute }]} accessibilityLabel={`Amount ${naira(value)}`}>
              {naira(value)}
            </Text>
            <Text style={[styles.meta, tooMuch && { color: colors.loss }]}>
              {`Between ${naira(MIN)} and ${naira(MAX)} per top up`}
            </Text>
          </View>

          <View style={styles.row}>
            {CHIPS.map((c) => (
              <Pressable
                key={c} accessibilityRole="button" accessibilityState={{ selected: value === c }}
                onPress={() => { Haptics.selectionAsync(); setAmount(String(c)); }}
                style={[styles.chip, value === c && styles.chipOn]}
              >
                <Text style={[styles.chipText, value === c && { color: colors.ink }]}>{naira(c)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row}>
            {METHODS.map((m) => {
              const on = method === m.key;
              return (
                <Pressable
                  key={m.key} accessibilityRole="button" accessibilityState={{ selected: on }}
                  onPress={() => { Haptics.selectionAsync(); setMethod(m.key); }}
                  style={[styles.method, on && styles.methodOn]}
                >
                  <Ionicons name={m.icon} size={22} color={on ? colors.gold : colors.textSoft} />
                  <Text style={[styles.methodText, on && { color: colors.gold }]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.pad}>
            {ROWS.map((row, ri) => (
              <View key={ri} style={styles.padRow}>
                {row.map((k) => (
                  <Pressable
                    key={k} style={({ pressed }) => [styles.key, pressed && { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                    accessibilityRole="button" accessibilityLabel={k === 'del' ? 'Delete' : k} onPress={() => press(k)}
                  >
                    {k === 'del'
                      ? <Ionicons name="backspace-outline" size={24} color={colors.text} />
                      : <Text style={styles.keyText}>{k}</Text>}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          <Pressable
            disabled={!valid} onPress={pay} accessibilityRole="button" accessibilityState={{ disabled: !valid }}
            style={{ opacity: valid ? 1 : 0.4 }}
          >
            <LinearGradient colors={[colors.gold, colors.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pay}>
              <Text style={styles.payText}>{valid ? `Add ${naira(value)}` : 'Enter an amount'}</Text>
            </LinearGradient>
          </Pressable>
          <Text style={styles.note}>18+. Only deposit what you can afford to lose.</Text>
        </ScrollView>

        {phase !== 'input' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
            {phase === 'processing' ? (
              <>
                <Spinner />
                <Text style={styles.big}>Processing</Text>
                <Text style={styles.meta}>{`Adding ${naira(value)} to your wallet`}</Text>
              </>
            ) : (
              <>
                <Tick />
                <Text style={styles.big}>{`${naira(paid)} added`}</Text>
                <Text style={styles.meta}>{`New balance ${naira(shownBalance)}`}</Text>
              </>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(2,10,7,0.74)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.sheet, overflow: 'hidden',
    borderTopLeftRadius: 32, borderTopRightRadius: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)',
  },
  gripArea: { height: 32, alignItems: 'center', justifyContent: 'center' },
  grip: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  content: { paddingHorizontal: MARGIN, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: font.bold, fontSize: 24, color: colors.text },
  meta: { fontFamily: font.regular, fontSize: 13, color: colors.textMute },
  amountBox: { alignItems: 'center', gap: 4, paddingVertical: 6 },
  amount: { fontFamily: font.bold, fontSize: 46, color: colors.text, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: font.semi, fontSize: 13, color: colors.text },
  method: {
    flex: 1, height: 68, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  methodOn: { borderColor: colors.gold, backgroundColor: 'rgba(255,194,75,0.12)' },
  methodText: { fontFamily: font.semi, fontSize: 12, color: colors.textSoft },
  pad: { gap: 8 },
  padRow: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: font.semi, fontSize: 22, color: colors.text, fontVariant: ['tabular-nums'] },
  pay: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  payText: { fontFamily: font.bold, fontSize: 17, color: colors.ink },
  note: { fontFamily: font.regular, fontSize: 12.5, color: colors.textMute, textAlign: 'center' },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.sheet, alignItems: 'center', justifyContent: 'center', gap: 12 },
  big: { fontFamily: font.bold, fontSize: 26, color: colors.text },
});
