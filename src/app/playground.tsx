// Speeltuin: schuif de score om het poppetje te testen (zoals de slider in
// het design), plus het expressieblad (design 2b).

import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../avatar/Avatar';
import { bandLine } from '../core/lines';
import { scoreLabel } from '../core/score';
import { useSettings } from '../store/settings';
import { Card, ScoreBar, SpeechBubble } from '../ui/components';
import { colors, type } from '../ui/theme';

const SHEET = [95, 75, 55, 35, 12];

export default function Playground() {
  const insets = useSafeAreaInsets();
  const avatarId = useSettings((s) => s.avatarId);
  const [score, setScore] = useState(72);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 18, alignItems: 'center' }}
    >
      <SpeechBubble text={bandLine(score)} />
      <Avatar health={score / 100} size={220} avatarId={avatarId} />
      <Text style={type.score}>{score}</Text>
      <ScoreBar score={score} />
      <Text style={type.caption}>{scoreLabel(score)}</Text>

      <Card style={styles.sliderCard}>
        <View style={styles.sliderHead}>
          <Text style={type.bodyMedium}>Simuleer je dag</Text>
          <Text style={type.caption}>vitaliteit {score}</Text>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={score}
          onValueChange={(v) => setScore(Math.round(v))}
          minimumTrackTintColor={colors.ink}
          maximumTrackTintColor={colors.track}
          thumbTintColor={colors.ink}
          accessibilityLabel="Score simuleren"
        />
      </Card>

      <Text style={[type.heading, { alignSelf: 'flex-start', marginTop: 12 }]}>Van topvorm tot uitgeput</Text>
      <View style={styles.sheet}>
        {SHEET.map((s) => (
          <View key={s} style={styles.sheetItem}>
            <Avatar health={s / 100} size={96} avatarId={avatarId} animated={false} />
            <Text style={[type.stat, { fontFamily: 'Geist_700Bold' }]}>{s}</Text>
            <Text style={type.caption}>{scoreLabel(s)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sliderCard: { alignSelf: 'stretch', paddingVertical: 14, gap: 10 },
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between' },
  sheet: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  sheetItem: { width: 100, alignItems: 'center', gap: 4 },
});
