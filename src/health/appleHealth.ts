// Apple Health bestaat alleen op iOS. Op Android en web gebruikt de app dit
// bestand (Metro kiest appleHealth.ios.ts op iPhone).

import type { HealthSource } from './types';

export const appleHealthSource: HealthSource = {
  id: 'apple-health',
  name: 'Apple Gezondheid',
  availability: async () => 'unsupported',
  requestPermissions: async () => false,
  readDay: async () => ({}),
};
