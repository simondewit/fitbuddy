// Bronnen: waar de data vandaan komt, status en laatste synchronisatie.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConnectHealth } from '../data/useConnectHealth';
import { isExpoGo, platformSource, platformSourceName } from '../health/sources';
import type { Availability } from '../health/types';
import { useSettings } from '../store/settings';
import { Button, Card, Row } from '../ui/components';
import { colors, type } from '../ui/theme';

function timeAgo(ts: number | null): string {
  if (!ts) return 'nog niet';
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'zojuist';
  if (min < 60) return `${min} min geleden`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} uur geleden`;
  return `${Math.round(h / 24)} dagen geleden`;
}

export default function Sources() {
  const insets = useSafeAreaInsets();
  const useDemo = useSettings((s) => s.useDemo);
  const setUseDemo = useSettings((s) => s.setUseDemo);
  const healthConnected = useSettings((s) => s.healthConnected);
  const lastSync = useSettings((s) => s.lastSync);
  const { connect, busy } = useConnectHealth();

  const source = platformSource();
  const [availability, setAvailability] = useState<Availability | null>(null);
  useEffect(() => {
    let alive = true;
    void (source?.availability() ?? Promise.resolve<Availability>('unsupported')).then((a) => alive && setAvailability(a));
    return () => {
      alive = false;
    };
  }, [source]);

  const name = platformSourceName();
  let status: string;
  if (isExpoGo) status = 'Niet beschikbaar in Expo Go. Gebruik een eigen build.';
  else if (Platform.OS === 'web') status = 'Niet beschikbaar in de browser.';
  else if (availability === 'needs-install') status = 'Health Connect moet nog geïnstalleerd of bijgewerkt worden.';
  else if (availability === 'unsupported') status = 'Niet beschikbaar op dit toestel.';
  else if (healthConnected && !useDemo) status = `Gekoppeld · laatst bijgewerkt ${timeAgo(lastSync)}`;
  else if (healthConnected) status = 'Gekoppeld, maar demodata staat aan.';
  else status = 'Nog niet gekoppeld.';

  const canConnect = !!source && (availability === 'available' || availability === 'needs-install');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}
    >
      <Card style={{ paddingVertical: 16, gap: 12 }}>
        <Text style={type.heading}>{name}</Text>
        <Text style={type.caption}>{status}</Text>
        {canConnect && (
          <Button
            title={healthConnected ? 'Toestemming opnieuw vragen' : `Koppel ${name}`}
            onPress={() => void connect()}
            disabled={busy}
          />
        )}
        {Platform.OS === 'ios' && healthConnected && (
          <Text style={type.caption}>
            Toestemming aanpassen doe je in de Gezondheid-app: profiel › Apps › FitBuddy.
          </Text>
        )}
        {Platform.OS === 'android' && source?.openSettings && healthConnected && (
          <Button title="Health Connect-instellingen" variant="secondary" onPress={() => source.openSettings?.()} />
        )}
      </Card>

      <Card>
        <Row
          title="Water"
          subtitle="Handmatig loggen, plus water uit je gezondheidsapp"
          onPress={() => router.push('/detail/water')}
          right={<Text style={type.caption}>›</Text>}
        />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <Row title="Strava" subtitle="Binnenkort. Strava-workouts die naar je gezondheidsapp syncen tellen nu al mee." />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <Row
          title="Demodata"
          subtitle="Bekijk de app met voorbeeldgegevens"
          right={<Switch value={useDemo} onValueChange={setUseDemo} disabled={!source && useDemo} />}
        />
      </Card>

      <Card>
        <Row title="Instellingen" onPress={() => router.push('/settings')} right={<Text style={type.caption}>›</Text>} />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        <Row title="Over FitBuddy en privacy" onPress={() => router.push('/about')} right={<Text style={type.caption}>›</Text>} />
      </Card>

      <Text style={[type.caption, { lineHeight: 19 }]}>
        Je gezondheidsgegevens blijven op je telefoon. FitBuddy heeft geen server en stuurt niets door.
      </Text>
    </ScrollView>
  );
}
