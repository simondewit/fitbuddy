import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { platformSource } from '../health/sources';
import { useSettings } from '../store/settings';

/** Vraagt toestemming voor de gezondheidsbron van dit toestel. Gedeeld met onboarding. */
export function useConnectHealth() {
  const setHealthConnected = useSettings((s) => s.setHealthConnected);
  const setUseDemo = useSettings((s) => s.setUseDemo);
  const [busy, setBusy] = useState(false);

  const connect = useCallback(async () => {
    const source = platformSource();
    if (!source) return false;
    setBusy(true);
    try {
      const status = await source.availability();
      if (status === 'needs-install') {
        // Health Connect moet geïnstalleerd of bijgewerkt worden.
        await Linking.openURL('market://details?id=com.google.android.apps.healthdata').catch(() =>
          Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'),
        );
        return false;
      }
      if (status !== 'available') return false;
      const ok = await source.requestPermissions();
      if (ok) {
        setUseDemo(false);
        setHealthConnected(true);
      }
      return ok;
    } finally {
      setBusy(false);
    }
  }, [setHealthConnected, setUseDemo]);

  return { connect, busy };
}
