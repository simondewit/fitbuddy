// De dag die op het hoofdscherm getoond wordt. Niet bewaard: bij opnieuw
// openen begint de app altijd bij vandaag.

import { create } from 'zustand';

import { startOfDay } from '../core/time';

interface SelectionState {
  /** null = vandaag (en blijft vandaag, ook na middernacht). */
  selected: Date | null;
  select: (date: Date | null) => void;
}

export const useSelection = create<SelectionState>()((set) => ({
  selected: null,
  select: (date) => set({ selected: date ? startOfDay(date) : null }),
}));
