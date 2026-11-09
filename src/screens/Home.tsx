import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAP, LiveCard, SNAP } from '../components/LiveCard';
import { Glass } from '../components/Glass';
import { MatchRow } from '../components/MatchRow';
import { Market, Match } from '../data';
import { OddsMap, Tick, useTween } from '../hooks';
import { colors, font, MARGIN, naira } from '../theme';

type Props = {
  matches: Match[]; odds: OddsMap; tick: Tick; picks: Record<string, Market>; balance: number;
  liveOnly: boolean; onTopUp: () => void; onPick: (id: string, mk: Market) => void;
};

export function Home({ matches, odds, tick, picks, balance, liveOnly, onTopUp, onPick }: Props) {
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollX.value = e.contentOffset.x; });
  const shownBalance = useTween(balance);
  const live = matches.filter((m) => m.live);
  const list = liveOnly ? live : matches.filter((m) => !m.live);

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 230 }}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>
          <Text style={{ fontFamily: font.regular }}>bet</Text>House
        </Text>
        <Pressable onPress={onTopUp} accessibilityRole="button" accessibilityLabel={`Balance ${naira(balance)}, tap to top up`}>
          <Glass blur={false} radius={22} style={styles.balance}>
            <View style={styles.balanceIn}>
              <Ionicons name="wallet-outline" size={18} color={colors.gold} />
              <Text style={styles.balanceText}>{naira(shownBalance)}</Text>
              <View style={styles.plus}><Ionicons name="add" size={16} color={colors.ink} /></View>
            </View>
          </Glass>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.h2}>Live now</Text>
        <Text style={styles.meta}>{`${live.length} matches`}</Text>
      </View>
      <Animated.ScrollView
        horizontal onScroll={onScroll} scrollEventThrottle={16} snapToInterval={SNAP}
        decelerationRate="fast" showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: MARGIN, gap: GAP }}
        style={{ flexGrow: 0 }}
      >
        {live.map((m, i) => (
          <LiveCard key={m.id} m={m} odds={odds[m.id]} pick={picks[m.id]} tick={tick} index={i} scrollX={scrollX} onPick={onPick} />
        ))}
      </Animated.ScrollView>

      <View style={[styles.sectionHead, { marginTop: 28 }]}>
        <Text style={styles.h2}>{liveOnly ? 'In play' : 'Coming up'}</Text>
      </View>
      <Glass style={{ marginHorizontal: MARGIN }} intensity={35}>
        {list.map((m, i) => (
          <MatchRow key={m.id} m={m} odds={odds[m.id]} pick={picks[m.id]} tick={tick} last={i === list.length - 1} onPick={onPick} />
        ))}
      </Glass>

      <Text style={styles.footer}>18+. Betting should be fun. Set a daily limit in Wallet any time.</Text>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: MARGIN, marginBottom: 24 },
  brand: { fontFamily: font.bold, fontSize: 26, color: colors.text, letterSpacing: -0.6 },
  balance: { height: 44 },
  balanceIn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  plus: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  balanceText: { fontFamily: font.semi, fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: MARGIN, marginBottom: 12 },
  h2: { fontFamily: font.semi, fontSize: 19, color: colors.text },
  meta: { fontFamily: font.regular, fontSize: 13, color: colors.textMute },
  footer: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 19, color: colors.textMute, paddingHorizontal: MARGIN, marginTop: 20 },
});
