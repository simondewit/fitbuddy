// Kiest de juiste gezondheidsbron voor dit toestel.

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { demoSource } from './demo';
import type { HealthSource } from './types';

/** Expo Go heeft geen HealthKit of Health Connect aan boord. */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * De echte bron van dit platform, of null als die er niet is (web, Expo Go).
 * Bewust met require: zo wordt native code alleen geladen waar die bestaat.
 */
export function platformSource(): HealthSource | null {
  if (isExpoGo) return null;
  /* eslint-disable @typescript-eslint/no-require-imports -- bewust lui laden, zie hierboven */
  if (Platform.OS === 'ios') {
    return (require('./appleHealth') as typeof import('./appleHealth')).appleHealthSource;
  }
  if (Platform.OS === 'android') {
    return (require('./healthConnect') as typeof import('./healthConnect')).healthConnectSource;
  }
  /* eslint-enable @typescript-eslint/no-require-imports */
  return null;
}

export function platformSourceName(): string {
  if (Platform.OS === 'ios') return 'Apple Gezondheid';
  if (Platform.OS === 'android') return 'Health Connect';
  return 'Gezondheidsdata';
}

/** De actieve bron, of null als er geen echte bron is en demo uit staat. */
export function activeSource(useDemo: boolean): HealthSource | null {
  if (useDemo) return demoSource;
  return platformSource();
}
