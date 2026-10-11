// Health Connect bestaat alleen op Android. Op iPhone en web gebruikt de app
// dit bestand (Metro kiest healthConnect.android.ts op Android).

import type { HealthSource } from './types';

export const healthConnectSource: HealthSource = {
  id: 'health-connect',
  name: 'Health Connect',
  availability: async () => 'unsupported',
  requestPermissions: async () => false,
  readDay: async () => ({}),
};
