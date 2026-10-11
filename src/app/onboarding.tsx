// Onboarding: welkom → poppetje kiezen → bron koppelen.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../avatar/Avatar';
import { AVATARS } from '../avatar/registry';
import { useConnectHealth } from '../data/useConnectHealth';
import { platformSource, platformSourceName } from '../health/sources';
import { useSettings } from '../store/settings';
import { Button, SpeechBubble } from '../ui/components';
import { colors, type } from '../ui/theme';

type Step = 'welcome' | 'avatar' | 'connect';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const avatarId = useSettings((s) => s.avatarId);
  const setAvatar = useSettings((s) => s.setAvatar);
  const setUseDemo = useSettings((s) => s.setUseDemo);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const { connect, busy } = useConnectHealth();
  const hasRealSource = platformSource() !== null;

  const finish = () => {
    completeOnboarding();
    router.replace('/');
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
    >
      {step === 'welcome' && (
        <>
          <SpeechBubble text="Hoi! Ik ben je gezondheid, maar dan met een gezicht." />
          <Avatar health={0.8} size={220} avatarId={avatarId} />
          <View style={styles.copy}>
            <Text style={[type.title, styles.center]}>Zie in één oogopslag hoe je erbij staat</Text>
            <Text style={[type.body, styles.center, { color: colors.muted }]}>
              Slaap, beweging en herstel worden één score. Je poppetje laat zien hoe het gaat, en zegt er eerlijk iets
              van.
            </Text>
          </View>
          <View style={styles.actions}>
            <Button title="Beginnen" onPress={() => setStep('avatar')} />
          </View>
        </>
      )}

      {step === 'avatar' && (
        <>
          <Text style={[type.title, styles.center]}>Kies je maatje</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((a) => {
              const active = a.id === avatarId;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setAvatar(a.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.avatarCard, active && styles.avatarCardActive]}
                >
                  <Avatar health={0.75} size={130} avatarId={a.id} animated={active} />
                  <Text style={type.heading}>{a.name}</Text>
                  <Text style={[type.caption, styles.center]}>{a.description}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[type.caption, styles.center]}>Meer maatjes volgen later.</Text>
          <View style={styles.actions}>
            <Button title="Verder" onPress={() => setStep('connect')} />
          </View>
        </>
      )}

      {step === 'connect' && (
        <>
          <Avatar health={0.6} size={180} avatarId={avatarId} />
          <View style={styles.copy}>
            <Text style={[type.title, styles.center]}>Koppel je gezondheidsdata</Text>
            <Text style={[type.body, styles.center, { color: colors.muted }]}>
              {hasRealSource
                ? `FitBuddy leest slaap, stappen, workouts, hartslag, HRV, water, energie en mindful minuten uit ${platformSourceName()}. Alles blijft op je telefoon.`
                : 'Op dit apparaat is geen gezondheidsapp beschikbaar. Je kunt de app bekijken met demodata.'}
            </Text>
          </View>
          <View style={styles.actions}>
            {hasRealSource && (
              <Button
                title={`Koppel ${platformSourceName()}`}
                disabled={busy}
                onPress={async () => {
                  await connect();
                  finish();
                }}
              />
            )}
            <Button
              title={hasRealSource ? 'Eerst rondkijken met demodata' : 'Bekijk met demodata'}
              variant={hasRealSource ? 'secondary' : 'primary'}
              onPress={() => {
                setUseDemo(true);
                finish();
              }}
            />
          </View>
          <Text style={[type.label, styles.center, { lineHeight: 17 }]}>
            FitBuddy is geen medisch hulpmiddel en geeft geen medisch advies.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, gap: 24 },
  copy: { gap: 10, maxWidth: 360 },
  center: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 'auto', maxWidth: 420, width: '100%' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  avatarCard: {
    width: 170,
    alignItems: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCardActive: { borderColor: colors.ink },
});
