// Over de app, privacy en disclaimer. Apple en Google willen dit kunnen vinden.

import Constants from 'expo-constants';
import { Linking, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIVACY_URL } from '../config';
import { Card, Row } from '../ui/components';
import { colors, type } from '../ui/theme';

export default function About() {
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '';
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}
    >
      <Text style={[type.body, { lineHeight: 22 }]}>
        FitBuddy maakt je gezondheid zichtbaar met één score en een poppetje dat laat zien hoe je erbij staat.
      </Text>

      <Text style={type.heading}>Privacy</Text>
      <Text style={[type.body, { lineHeight: 22 }]}>
        FitBuddy leest gegevens uit Apple Gezondheid of Health Connect, alleen met jouw toestemming. Alles wordt op je
        telefoon berekend en bewaard. Er is geen account, geen server, geen reclame en geen tracking. FitBuddy schrijft
        niets terug naar je gezondheidsapp.
      </Text>

      <Text style={type.heading}>Geen medisch advies</Text>
      <Text style={[type.body, { lineHeight: 22 }]}>
        FitBuddy is een hulpmiddel om bewuster met je gezondheid bezig te zijn. Het is geen medisch hulpmiddel en stelt
        geen diagnoses. Twijfel je over je gezondheid, neem dan contact op met je huisarts.
      </Text>

      <Card>
        <Row title="Privacybeleid" onPress={() => void Linking.openURL(PRIVACY_URL)} right={<Text style={type.caption}>↗</Text>} />
      </Card>

      <Text style={type.caption}>Versie {version}</Text>
    </ScrollView>
  );
}
