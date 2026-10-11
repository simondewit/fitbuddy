// Alle beschikbare poppetjes. Een nieuw poppetje toevoegen:
// 1. Maak een tekening (zoals Pip.tsx) met een Body en een Shadow die
//    AvatarParams gebruiken.
// 2. Voeg hem hieronder toe.
// 3. Klaar: de keuze verschijnt vanzelf in onboarding en instellingen.

import type { ComponentType } from 'react';

import type { AvatarParams } from './params';
import { PipBody, PipShadow, PIP_VIEWBOX } from './Pip';

export interface AvatarDrawing {
  id: string;
  name: string;
  description: string;
  viewBox: { width: number; height: number };
  Body: ComponentType<{ p: AvatarParams; blink?: boolean; uid: string }>;
  Shadow: ComponentType;
}

export const AVATARS: readonly AvatarDrawing[] = [
  {
    id: 'pip',
    name: 'Pip',
    description: 'Een mensje. Lijkt verdacht veel op jou.',
    viewBox: PIP_VIEWBOX,
    Body: PipBody,
    Shadow: PipShadow,
  },
];

export const DEFAULT_AVATAR_ID = 'pip';

export function getAvatar(id: string | undefined): AvatarDrawing {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]!;
}
