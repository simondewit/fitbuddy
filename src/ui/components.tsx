// Kleine, herbruikbare bouwstenen in de stijl van het design.

import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { scoreColor } from '../core/color';
import { colors, fonts, type } from './theme';

export function Pill({ label, onPress, accessibilityLabel }: { label: string; onPress?: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={8}
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.6 }]}
    >
      <Text style={type.pill}>{label}</Text>
    </Pressable>
  );
}

export function SpeechBubble({ text, onPress }: { text: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint="Tik voor een volgende gedachte"
      style={styles.bubbleWrap}
    >
      <View style={styles.bubble}>
        <Text style={[type.body, styles.bubbleText]}>{text}</Text>
      </View>
      <View style={styles.bubbleTail} />
    </Pressable>
  );
}

export function ScoreBar({ score, width = 250 }: { score: number; width?: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <View style={[styles.track, { width }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: scoreColor(pct) }]} />
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? colors.background : colors.ink }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.bodyMedium}>{title}</Text>
        {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.6 }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.pillBg,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
  },
  bubbleWrap: { alignItems: 'center' },
  bubble: {
    maxWidth: 270,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#3b2a22',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleText: { textAlign: 'center', lineHeight: 20.7 },
  bubbleTail: {
    width: 12,
    height: 12,
    backgroundColor: colors.card,
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
  },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  divider: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.line },
  button: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', alignSelf: 'stretch' },
  buttonPrimary: { backgroundColor: colors.ink },
  buttonSecondary: { backgroundColor: colors.pillBg },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16 },
  card: { backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
});
