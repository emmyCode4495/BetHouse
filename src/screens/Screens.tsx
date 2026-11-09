import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '../components/Glass';
import { colors, font, MARGIN, naira } from '../theme';

export type Tx = { id: string; kind: 'topup' | 'bet'; amount: number; label: string; at: number };
const clock = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export type Ticket = { id: string; legs: { id: string; match: string; label: string; odds: number }[]; stake: number; odds: number };

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 150, paddingHorizontal: MARGIN, gap: 14 }}
    >
      <Text style={styles.title}>{title}</Text>
      {children}
    </Animated.ScrollView>
  );
}

export function MyBets({ tickets }: { tickets: Ticket[] }) {
  return (
    <Shell title="My bets">
      {tickets.length === 0 ? (
        <Glass blur={false}>
          <View style={styles.empty}>
            <Text style={styles.h2}>No bets yet</Text>
            <Text style={styles.body}>Tap any odds on Home to start a slip. Your placed bets show up here.</Text>
          </View>
        </Glass>
      ) : (
        tickets.map((t) => (
          <Glass key={t.id} blur={false}>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.h2}>{t.legs.length > 1 ? `Accumulator, ${t.legs.length} picks` : 'Single'}</Text>
                <View style={styles.open}><Text style={styles.openText}>Open</Text></View>
              </View>
              {t.legs.map((l) => (
                <View key={l.id} style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.num}>{l.label}</Text>
                    <Text style={styles.meta}>{l.match}</Text>
                  </View>
                  <Text style={styles.num}>{l.odds.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.rule} />
              <View style={styles.rowBetween}>
                <Text style={styles.body}>{`Stake ${naira(t.stake)}`}</Text>
                <Text style={styles.ret}>{`Returns ${naira(t.stake * t.odds)}`}</Text>
              </View>
            </View>
          </Glass>
        ))
      )}
    </Shell>
  );
}

const LIMITS = [10000, 20000, 50000];
type WalletProps = { balance: number; limit: number; spent: number; setLimit: (n: number) => void; onTopUp: () => void; txs: Tx[] };
export function Wallet({ balance, limit, spent, setLimit, onTopUp, txs }: WalletProps) {
  const bar = useAnimatedStyle(() => ({ width: withTiming(`${Math.min(100, (spent / limit) * 100)}%`, { duration: 600 }) }));
  return (
    <Shell title="Wallet">
      <Glass blur={false}>
        <View style={styles.card}>
          <Text style={styles.body}>Balance</Text>
          <Text style={styles.big}>{naira(balance)}</Text>
          <Pressable
            accessibilityRole="button" accessibilityLabel="Top up wallet"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onTopUp(); }}
          >
            <LinearGradient colors={[colors.gold, colors.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topUp}>
              <Ionicons name="add" size={22} color={colors.ink} />
              <Text style={styles.topUpText}>Top up</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Glass>
      <Glass blur={false}>
        <View style={styles.card}>
          <Text style={styles.h2}>Daily limit</Text>
          <Text style={styles.body}>{`${naira(spent)} used of ${naira(limit)} today`}</Text>
          <View style={styles.track}><Animated.View style={[styles.fill, bar]} /></View>
          <View style={styles.chips}>
            {LIMITS.map((l) => (
              <Pressable
                key={l} accessibilityRole="button" accessibilityState={{ selected: limit === l }}
                onPress={() => { Haptics.selectionAsync(); setLimit(l); }}
                style={[styles.chip, limit === l && styles.chipOn]}
              >
                <Text style={[styles.chipText, limit === l && { color: colors.ink }]}>{naira(l)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Glass>
      <Text style={styles.h2}>Recent activity</Text>
      <Glass blur={false}>
        {txs.length === 0 ? (
          <View style={styles.empty}><Text style={styles.body}>No activity yet. Top ups and bets will show here.</Text></View>
        ) : (
          txs.slice(0, 8).map((t, i) => (
            <View key={t.id} style={[styles.tx, i < Math.min(txs.length, 8) - 1 && styles.txDivider]}>
              <View style={[styles.txIcon, { backgroundColor: t.kind === 'topup' ? 'rgba(110,240,176,0.16)' : 'rgba(255,255,255,0.10)' }]}>
                <Ionicons name={t.kind === 'topup' ? 'arrow-down' : 'receipt-outline'} size={18} color={t.kind === 'topup' ? colors.win : colors.textSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.num}>{t.label}</Text>
                <Text style={styles.meta}>{`Today ${clock(t.at)}`}</Text>
              </View>
              <Text style={[styles.num, { color: t.amount > 0 ? colors.win : colors.text }]}>
                {`${t.amount > 0 ? '+' : '-'}${naira(Math.abs(t.amount))}`}
              </Text>
            </View>
          ))
        )}
      </Glass>
      <Text style={styles.body}>If betting stops being fun, talk to someone you trust or contact a local support service.</Text>
    </Shell>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.bold, fontSize: 28, color: colors.text, letterSpacing: -0.5, marginBottom: 6 },
  h2: { fontFamily: font.semi, fontSize: 17, color: colors.text },
  body: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21, color: colors.textSoft },
  num: { fontFamily: font.semi, fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  ret: { fontFamily: font.semi, fontSize: 14.5, color: colors.gold },
  big: { fontFamily: font.bold, fontSize: 36, color: colors.text, fontVariant: ['tabular-nums'] },
  empty: { padding: 20, gap: 8 },
  meta: { fontFamily: font.regular, fontSize: 12.5, color: colors.textMute },
  topUp: { height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  topUpText: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  txDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.14)' },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 18, gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)' },
  open: { paddingHorizontal: 10, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.gold, justifyContent: 'center' },
  openText: { fontFamily: font.semi, fontSize: 12, color: colors.gold },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.gold },
  chips: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: font.semi, fontSize: 13.5, color: colors.text },
});
