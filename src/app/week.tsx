// Weekoverzicht: per dag de score en een mini-poppetje met de uitdrukking
// van die dag. Tik op een dag om die op het hoofdscherm te bekijken.

import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../avatar/Avatar';
import { shortDate } from '../core/format';
import { scoreLabel } from '../core/score';
import { isSameDay } from '../core/time';
import { useHealthDays } from '../data/useHealthDays';
import { useSelection } from '../store/selection';
import { useSettings } from '../store/settings';
import { Card, ScoreBar } from '../ui/components';
import { colors, type } from '../ui/theme';

export default function Week() {
  const insets = useSafeAreaInsets();
  const avatarId = useSettings((s) => s.avatarId);
  const select = useSelection((s) => s.select);
  const selected = useSelection((s) => s.selected);
  const { days, loading, refresh } = useHealthDays(new Date(), 7);

  const scored = days.filter((d) => d.result.available > 0);
  const average = scored.length ? Math.round(scored.reduce((a, d) => a + d.result.score, 0) / scored.length) : null;
  const today = new Date();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.muted} />}
    >
      <Text style={type.caption}>
        {average !== null ? `Gemiddeld ${average} deze week · ${scoreLabel(average).toLowerCase()}` : 'Nog geen gegevens deze week'}
      </Text>
      <Card>
        {[...days].reverse().map((d, i) => {
          const has = d.result.available > 0;
          const isToday = isSameDay(d.date, today);
          const active = selected ? isSameDay(d.date, selected) : isToday;
          return (
            <Pressable
              key={d.key}
              onPress={() => {
                select(isToday ? null : d.date);
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${isToday ? 'Vandaag' : shortDate(d.date)}, score ${has ? d.result.score : 'onbekend'}`}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.face}>
                <Avatar health={has ? d.result.score / 100 : 0.6} size={52} avatarId={avatarId} animated={false} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[type.bodyMedium, active && { fontFamily: 'Geist_700Bold' }]}>
                  {isToday ? 'Vandaag' : shortDate(d.date)}
                </Text>
                <ScoreBar score={has ? d.result.score : 0} width={140} />
              </View>
              <Text style={[type.stat, !has && { color: colors.muted }]}>{has ? d.result.score : '–'}</Text>
            </Pressable>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  face: { width: 52, alignItems: 'center' },
});
