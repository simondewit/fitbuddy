// Instellingen: poppetje, welke signalen meetellen, en opnieuw beginnen.

import { router } from 'expo-router';
import { Alert, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AVATARS } from '../avatar/registry';
import { formatGoal } from '../core/format';
import { SIGNALS } from '../core/signals';
import { useSettings } from '../store/settings';
import { Card, Row } from '../ui/components';
import { colors, type } from '../ui/theme';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const avatarId = useSettings((s) => s.avatarId);
  const setAvatar = useSettings((s) => s.setAvatar);
  const disabled = useSettings((s) => s.disabledSignals);
  const toggleSignal = useSettings((s) => s.toggleSignal);
  const reset = useSettings((s) => s.reset);

  const confirmReset = () => {
    const doReset = () => {
      reset();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      doReset();
      return;
    }
    Alert.alert('Alles wissen?', 'Je instellingen en gelogde water worden gewist. Je gegevens in je gezondheidsapp blijven staan.', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Wissen', style: 'destructive', onPress: doReset },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 12 }}
    >
      <Text style={[type.caption, { marginLeft: 4 }]}>Maatje</Text>
      <Card>
        {AVATARS.map((a, i) => (
          <View key={a.id}>
            {i > 0 && <View style={{ height: 1, backgroundColor: colors.line }} />}
            <Row
              title={a.name}
              subtitle={a.description}
              onPress={() => setAvatar(a.id)}
              right={<Text style={type.bodyMedium}>{a.id === avatarId ? '✓' : ''}</Text>}
            />
          </View>
        ))}
      </Card>

      <Text style={[type.caption, { marginLeft: 4, marginTop: 12 }]}>Wat telt mee in je score</Text>
      <Card>
        {SIGNALS.map((s, i) => (
          <View key={s.key}>
            {i > 0 && <View style={{ height: 1, backgroundColor: colors.line }} />}
            <Row
              title={s.label}
              subtitle={`Doel ${formatGoal(s.key, s.goal)} · ${s.weight} punten`}
              right={
                <Switch
                  value={!disabled.includes(s.key)}
                  onValueChange={() => toggleSignal(s.key)}
                  accessibilityLabel={`${s.label} meetellen`}
                />
              }
            />
          </View>
        ))}
      </Card>
      <Text style={[type.caption, { marginHorizontal: 4, lineHeight: 19 }]}>
        Zet je iets uit, dan worden de punten van de andere signalen opgeschaald naar 100. Signalen zonder data (bijvoorbeeld
        HRV zonder horloge) tellen automatisch niet mee.
      </Text>

      <Card style={{ marginTop: 12 }}>
        <Row title="Speeltuin" subtitle="Schuif de score en bekijk alle uitdrukkingen" onPress={() => router.push('/playground')} right={<Text style={type.caption}>›</Text>} />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <Row title="Alles wissen en opnieuw beginnen" onPress={confirmReset} />
      </Card>
    </ScrollView>
  );
}
