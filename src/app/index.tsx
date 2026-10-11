// Hoofdscherm (design 2a): spraakwolk, poppetje, score, balk, label en
// drie kerncijfers. Weinig informatie, één duidelijke boodschap.

import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../avatar/Avatar';
import { formatHours, formatSteps, shortDate } from '../core/format';
import { thoughts } from '../core/lines';
import { scoreLabel } from '../core/score';
import { isSameDay } from '../core/time';
import { useHealthDays } from '../data/useHealthDays';
import { useSelection } from '../store/selection';
import { useSettings } from '../store/settings';
import { Divider, Pill, ScoreBar, SpeechBubble } from '../ui/components';
import { colors, type } from '../ui/theme';

export default function Home() {
  const onboarded = useSettings((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Dashboard />;
}

function Dashboard() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const avatarId = useSettings((s) => s.avatarId);
  const useDemo = useSettings((s) => s.useDemo);
  const selected = useSelection((s) => s.selected);
  const select = useSelection((s) => s.select);

  const date = selected ?? new Date();
  const isToday = isSameDay(date, new Date());
  const { days, loading, refresh, noSource } = useHealthDays(date, 1);
  const day = days[0]!;
  const { result, recovery, values } = day;

  const lines = useMemo(() => thoughts(result), [result]);
  // Bij een andere dag begint het wolkje weer bij de eerste gedachte.
  const [thought, setThought] = useState({ key: day.key, index: 0 });
  const lineIndex = thought.key === day.key ? thought.index : 0;
  const line = noSource
    ? 'Ik heb nog geen data. Koppel Apple Gezondheid of Health Connect via Bronnen.'
    : (lines[lineIndex % lines.length] ?? '');

  const nextThought = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    setThought((t) => ({ key: day.key, index: (t.key === day.key ? t.index : 0) + 1 }));
  };

  // Poppetje kleiner op kleine schermen, zodat alles zonder scrollen past.
  const avatarSize = Math.min(250, width * 0.64, height * 0.3);
  const hasData = result.available > 0;
  const score = hasData ? result.score : 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.muted} />}
    >
      <View style={styles.topBar}>
        <Pill
          label={isToday ? 'Vandaag' : shortDate(date)}
          accessibilityLabel="Kies een dag"
          onPress={() => router.push('/week')}
        />
        <Pill label="Bronnen" onPress={() => router.push('/sources')} />
      </View>

      {!isToday && (
        <Pressable onPress={() => select(null)} accessibilityRole="button" hitSlop={8}>
          <Text style={[type.caption, styles.backToday]}>Terug naar vandaag</Text>
        </Pressable>
      )}

      <View style={styles.bubbleArea}>
        <SpeechBubble text={line} onPress={nextThought} />
      </View>

      <Pressable onPress={nextThought} accessibilityElementsHidden style={{ marginTop: 6 }}>
        <Avatar health={hasData ? score / 100 : 0.6} size={avatarSize} avatarId={avatarId} />
      </Pressable>

      <Text style={[type.score, styles.score]} accessibilityLabel={`Vitaliteit ${hasData ? score : 'onbekend'}`}>
        {hasData ? score : '–'}
      </Text>
      <View style={{ marginTop: 14 }}>
        <ScoreBar score={score} />
      </View>
      <Text style={[type.caption, { marginTop: 8 }]}>{hasData ? scoreLabel(score) : 'Nog geen gegevens'}</Text>
      {useDemo && <Text style={[type.label, styles.demo]}>Demodata</Text>}

      <Divider style={{ marginTop: 30, marginBottom: 22 }} />

      <View style={styles.stats}>
        <Stat label="Slaap" value={values.sleep != null ? formatHours(values.sleep) : '–'} onPress={() => router.push('/detail/sleep')} />
        <Stat label="Beweging" value={values.steps != null ? formatSteps(values.steps) : '–'} onPress={() => router.push('/detail/steps')} />
        <Stat label="Herstel" value={recovery ?? '–'} onPress={() => router.push('/detail/hrv')} />
      </View>

      <Pressable
        onPress={() => router.push('/detail/water')}
        accessibilityRole="button"
        hitSlop={10}
        style={({ pressed }) => [styles.waterLink, pressed && { opacity: 0.6 }]}
      >
        <Text style={type.caption}>＋ Water loggen</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.stat, pressed && { opacity: 0.6 }]}
    >
      <Text style={type.label}>{label}</Text>
      <Text style={type.stat}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 22, flexGrow: 1 },
  topBar: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
  backToday: { marginTop: 10, textDecorationLine: 'underline' },
  bubbleArea: { marginTop: 22, minHeight: 86, justifyContent: 'flex-end', alignItems: 'center' },
  score: { marginTop: 18 },
  demo: { marginTop: 6, opacity: 0.8 },
  stats: { alignSelf: 'stretch', flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  waterLink: { marginTop: 26 },
});
