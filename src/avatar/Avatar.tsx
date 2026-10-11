// Het levende poppetje: ademt, knippert en beweegt vloeiend mee als de
// score verandert. De tekening zelf komt uit registry.ts.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';

import { avatarParams } from './params';
import { getAvatar } from './registry';

interface Props {
  /** Gezondheid 0..1. */
  health: number;
  /** Breedte in punten. */
  size?: number;
  avatarId?: string;
  /** Uit voor kleine, stilstaande poppetjes (weekoverzicht). */
  animated?: boolean;
}

/** Laat een getal in ~0,7 s naar een nieuwe waarde glijden. */
function useSmoothValue(target: number, enabled: boolean): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const valueRef = useRef(target);

  useEffect(() => {
    if (!enabled) {
      valueRef.current = target;
      return;
    }
    fromRef.current = valueRef.current;
    const start = Date.now();
    const duration = 700;
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      valueRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);

  return enabled ? value : target;
}

/** Knippert af en toe, met een beetje willekeur zodat het levend oogt. */
function useBlink(intervalSeconds: number, enabled: boolean): boolean {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let open: ReturnType<typeof setTimeout>;
    let next: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const wait = intervalSeconds * 1000 * (0.7 + Math.random() * 0.6);
      next = setTimeout(() => {
        setClosed(true);
        open = setTimeout(() => {
          setClosed(false);
          schedule();
        }, 130);
      }, wait);
    };
    schedule();
    return () => {
      clearTimeout(open);
      clearTimeout(next);
    };
  }, [intervalSeconds, enabled]);
  return closed;
}

export function Avatar({ health, size = 250, avatarId, animated = true }: Props) {
  const reduceMotion = useReducedMotion();
  const live = animated && !reduceMotion;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const drawing = getAvatar(avatarId);
  const h = useSmoothValue(health, live);
  const p = useMemo(() => avatarParams(h), [h]);
  const blink = useBlink(p.blinkSeconds, live);

  const { width: vw, height: vh } = drawing.viewBox;
  const height = (size * vh) / vw;

  // Ademhaling: 3 eenheden omhoog en terug, sneller bij een hoge score.
  const breathe = useSharedValue(0);
  const breatheMs = Math.round(p.breatheSeconds * 1000);
  const breatheBucket = Math.round(breatheMs / 250) * 250; // niet bij elk frame herstarten
  useEffect(() => {
    if (!live) {
      cancelAnimation(breathe);
      breathe.value = 0;
      return;
    }
    breathe.value = 0;
    breathe.value = withRepeat(withTiming(1, { duration: breatheBucket / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breathe);
  }, [live, breatheBucket, breathe]);

  const unit = size / vw;
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * unit * breathe.value }],
  }));

  const { Body, Shadow } = drawing;
  const viewBox = `0 0 ${vw} ${vh}`;

  return (
    <View
      style={{ width: size, height }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${drawing.name}, ${describe(health)}`}
    >
      <Svg width={size} height={height} viewBox={viewBox} style={{ position: 'absolute', overflow: 'visible' }}>
        <Shadow />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: size, height }, breatheStyle]}>
        <Svg width={size} height={height} viewBox={viewBox} style={{ overflow: 'visible' }}>
          <Body p={p} blink={blink} uid={uid} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function describe(h: number): string {
  if (h >= 0.85) return 'straalt en lacht breed';
  if (h >= 0.65) return 'lacht tevreden';
  if (h >= 0.45) return 'kijkt neutraal';
  if (h >= 0.25) return 'kijkt moe, met wallen';
  return 'is uitgeput en zweet';
}
