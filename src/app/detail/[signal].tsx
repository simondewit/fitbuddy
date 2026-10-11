// Detail van één signaal: waarde, doel, punten en het verloop van 7 dagen.
// Voor water ook knoppen om handmatig te loggen.

import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatGoal, formatSignal, shortDay } from '../../core/format';
import { signalRatio } from '../../core/score';
import { SIGNAL_KEYS, SignalKey, signalConfig } from '../../core/signals';
import { useHealthDays } from '../../data/useHealthDays';
import { useSelection } from '../../store/selection';
import { useSettings } from '../../store/settings';
import { Button, Card, Row } from '../../ui/components';
import { colors, type } from '../../ui/theme';

const EXPLAIN: Record<SignalKey, string> = {
  sleep: 'Totale slaap in de nacht voor deze dag, van 18:00 tot 14:00. Overlap tussen telefoon en horloge telt één keer.',
  steps: 'Alle stappen van deze dag, van telefoon en horloge samen.',
  workout: 'Minuten aan workouts uit Apple Gezondheid of Health Connect. Strava-workouts komen hier ook binnen als Strava met je gezondheidsapp synct.',
  restingHr: 'Je hartslag in rust, gemeten door je horloge. Lager is meestal beter. Op of onder het doel krijg je alle punten, vanaf 72 geen.',
  hrv: 'Hartslagvariabiliteit: hoe ontspannen je zenuwstelsel is. Hoger is beter. Apple meet dit anders dan Android, de getallen zijn niet één op één te vergelijken.',
  water: 'Water dat je hier logt, plus wat andere apps in je gezondheidsapp hebben gezet.',
  activeEnergy: 'Calorieën die je verbrandt door te bewegen, bovenop je rustverbranding.',
  mindful: 'Minuten meditatie of ademoefeningen, bijvoorbeeld uit de Mindfulness-app of Headspace.',
};

export default function Detail() {
  const { signal } = useLocalSearchParams<{ signal: string }>();
  const key: SignalKey = SIGNAL_KEYS.includes(signal as SignalKey) ? (signal as SignalKey) : 'sleep';
  const config = signalConfig(key);
  const insets = useSafeAreaInsets();
  const selected = useSelection((s) => s.selected);
  const date = selected ?? new Date();
  const { days } = useHealthDays(date, 7);
  const today = days[days.length - 1]!;
  const part = today.result.signals.find((s) => s.key === key)!;
  const disabled = useSettings((s) => s.disabledSignals.includes(key));

  const values = days.map((d) => d.values[key] ?? null);
  const showRecovery = key === 'hrv' || key === 'restingHr' || key === 'sleep';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}
    >
      <Stack.Screen options={{ title: config.label }} />

      <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
        <Text style={[type.score, { fontSize: 56, lineHeight: 62, letterSpacing: -2 }]}>{formatSignal(key, part.value)}</Text>
        <Text style={type.caption}>
          Doel {formatGoal(key, config.goal)}
          {part.ratio !== null ? ` · ${Math.round(part.points)} van ${Math.round(part.maxPoints)} punten` : ''}
        </Text>
        {disabled && <Text style={type.caption}>Dit signaal staat uit in Instellingen.</Text>}
      </View>

      {key === 'water' && <WaterLogger dayKey={today.key} />}

      <Card style={{ paddingVertical: 16 }}>
        <Text style={[type.heading, { marginBottom: 14 }]}>Afgelopen 7 dagen</Text>
        <View style={styles.chart} accessible accessibilityLabel={`Verloop ${config.label} afgelopen 7 dagen`}>
          {days.map((d, i) => {
            const v = values[i];
            const r = v === null || v === undefined ? 0 : signalRatio(config, v);
            const isLast = i === days.length - 1;
            return (
              <View key={d.key} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(4, r * 100)}%`,
                        backgroundColor: r >= 0.8 ? '#4fae6f' : r >= 0.5 ? '#d8b44a' : '#d4704f',
                        opacity: v === null || v === undefined ? 0.2 : isLast ? 1 : 0.75,
                      },
                    ]}
                  />
                </View>
                <Text style={[type.label, isLast && { color: colors.ink }]}>{shortDay(d.date)}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {showRecovery && (
        <Card>
          <Text style={[type.heading, { marginTop: 14 }]}>Herstel: {today.recovery ?? 'onbekend'}</Text>
          <Text style={[type.caption, { marginTop: 4 }]}>Afgeleid van slaap, HRV en rusthartslag.</Text>
          {(['sleep', 'hrv', 'restingHr'] as const).map((k) => (
            <Row key={k} title={signalConfig(k).label} right={<Text style={type.bodyMedium}>{formatSignal(k, today.values[k])}</Text>} />
          ))}
        </Card>
      )}

      <Text style={[type.caption, { lineHeight: 19 }]}>{EXPLAIN[key]}</Text>
    </ScrollView>
  );
}

function WaterLogger({ dayKey }: { dayKey: string }) {
  const addWater = useSettings((s) => s.addWater);
  const logged = useSettings((s) => s.water[dayKey] ?? 0);
  return (
    <Card style={{ paddingVertical: 16, gap: 12 }}>
      <Text style={type.caption}>Zelf gelogd: {formatSignal('water', logged)}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="+ Glas (250 ml)" onPress={() => addWater(dayKey, 0.25)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="+ Fles (500 ml)" onPress={() => addWater(dayKey, 0.5)} />
        </View>
      </View>
      <Button title="Laatste glas eraf" variant="secondary" disabled={logged <= 0} onPress={() => addWater(dayKey, -0.25)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', height: 140, gap: 8 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
});
