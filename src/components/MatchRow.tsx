import { StyleSheet, Text, View } from 'react-native';
import { Market, Match, pickLabel, shortLabel } from '../data';
import type { Tick } from '../hooks';
import { colors, font } from '../theme';
import { Crest } from './Crest';
import { OddsButton } from './OddsButton';

const MARKETS: Market[] = ['1', 'X', '2'];

type Props = {
  m: Match; odds: Record<Market, number>; pick?: Market; tick: Tick; last: boolean;
  onPick: (id: string, mk: Market) => void;
};

export function MatchRow({ m, odds, pick, tick, last, onPick }: Props) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.meta}>
        <Text style={styles.league}>{m.league}</Text>
        <Text style={styles.kick}>{m.live ? `${m.minute}'` : m.kickoff}</Text>
      </View>
      <View style={styles.teams}>
        {[m.home, m.away].map((tm) => (
          <View key={tm.code} style={styles.team}>
            <Crest team={tm} size={28} />
            <Text style={styles.name}>{tm.name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.odds}>
        {MARKETS.map((mk) => {
          const hit = tick.key === `${m.id}:${mk}`;
          return (
            <OddsButton
              key={mk}
              label={shortLabel(m, mk)}
              value={odds[mk]}
              selected={pick === mk}
              a11y={`${pickLabel(m, mk)}, odds ${odds[mk].toFixed(2)}`}
              flashN={hit ? tick.n : undefined}
              flashDir={hit ? tick.dir : undefined}
              onPress={() => onPick(m.id, mk)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.14)' },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  league: { fontFamily: font.regular, fontSize: 12.5, color: colors.textMute },
  kick: { fontFamily: font.semi, fontSize: 12.5, color: colors.textSoft },
  teams: { gap: 8 },
  team: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: font.semi, fontSize: 15, color: colors.text },
  odds: { flexDirection: 'row', gap: 8 },
});
