import { Text, View } from 'react-native';
import type { Team } from '../data';
import { font } from '../theme';

export function Crest({ team, size = 32 }: { team: Team; size?: number }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: team.bg,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
      }}
    >
      <Text style={{ color: team.fg, fontFamily: font.bold, fontSize: size * 0.33 }}>{team.code}</Text>
    </View>
  );
}
