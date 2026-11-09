import { ComponentRef, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurTargetView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { Backdrop } from './src/components/Backdrop';
import { BlurTargetContext } from './src/components/Glass';
import { SlipBar } from './src/components/SlipBar';
import { TabBar, TabKey } from './src/components/TabBar';
import { Leg, TicketSheet } from './src/components/TicketSheet';
import { MATCHES, Market, pickLabel } from './src/data';
import { useLiveOdds } from './src/hooks';
import { Home } from './src/screens/Home';
import { MyBets, Ticket, Wallet } from './src/screens/Screens';
import { colors } from './src/theme';

function Shell() {
  const targetRef = useRef<ComponentRef<typeof View> | null>(null);
  const { odds, tick } = useLiveOdds(MATCHES);
  const [tab, setTab] = useState<TabKey>('home');
  const [picks, setPicks] = useState<Record<string, Market>>({});
  const [slipOpen, setSlipOpen] = useState(false);
  const [stake, setStake] = useState(1000);
  const [balance, setBalance] = useState(24500);
  const [spent, setSpent] = useState(3000);
  const [limit, setLimit] = useState(20000);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const legs: Leg[] = useMemo(
    () =>
      Object.entries(picks).map(([id, mk]) => {
        const m = MATCHES.find((x) => x.id === id)!;
        return { id, matchLabel: `${m.home.name} v ${m.away.name}`, pickLabel: pickLabel(m, mk), odds: odds[id][mk] };
      }),
    [picks, odds],
  );
  const totalOdds = legs.reduce((a, l) => a * l.odds, 1);

  const onPick = useCallback((id: string, mk: Market) => {
    setPicks((p) => {
      const next = { ...p };
      if (next[id] === mk) delete next[id];
      else next[id] = mk;
      return next;
    });
  }, []);
  const onRemove = useCallback((id: string) => {
    setPicks((p) => { const n = { ...p }; delete n[id]; return n; });
  }, []);

  const onPlaced = useCallback(() => {
    setTickets((t) => [
      { id: String(Date.now()), legs: legs.map((l) => ({ label: l.pickLabel, odds: l.odds })), stake, odds: totalOdds },
      ...t,
    ]);
    setBalance((b) => b - stake);
    setSpent((s) => s + stake);
    setPicks({});
    setSlipOpen(false);
    setTab('bets');
  }, [legs, stake, totalOdds]);

  return (
    <View style={styles.root}>
      <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
        <Backdrop />
      </BlurTargetView>
      <BlurTargetContext.Provider value={targetRef}>
        <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ flex: 1 }}>
          {(tab === 'home' || tab === 'live') && (
            <Home matches={MATCHES} odds={odds} tick={tick} picks={picks} balance={balance} liveOnly={tab === 'live'} onPick={onPick} />
          )}
          {tab === 'bets' && <MyBets tickets={tickets} />}
          {tab === 'wallet' && <Wallet balance={balance} limit={limit} spent={spent} setLimit={setLimit} />}
        </Animated.View>
        <SlipBar count={legs.length} totalOdds={totalOdds} onOpen={() => setSlipOpen(true)} />
        <TabBar active={tab} onChange={setTab} />
        {slipOpen && (
          <TicketSheet
            legs={legs} stake={stake} setStake={setStake} remaining={Math.max(0, limit - spent)} balance={balance}
            onRemove={onRemove} onClose={() => setSlipOpen(false)} onPlaced={onPlaced}
          />
        )}
      </BlurTargetContext.Provider>
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ Sora_400Regular, Sora_600SemiBold, Sora_700Bold, DMMono_400Regular, DMMono_500Medium });
  if (!loaded) return <View style={styles.root} />;
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Shell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.night } });
