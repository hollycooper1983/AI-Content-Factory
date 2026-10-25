import type { IndustryId } from './types';

export interface StarterService {
  name: string;
  durationMinutes: number;
  priceCents: number;
  depositCents?: number;
}

export interface Industry {
  id: IndustryId;
  label: string;
  sub: string;
  /** Bundled image module (result of require). */
  image: number;
  bufferMinutes: number;
  slotStepMinutes: number;
  starters: StarterService[];
}

// Brand photography generated with fal.ai (Bria FIBO 2, licensed training data).
export const INDUSTRIES: Industry[] = [
  {
    id: 'hair',
    label: 'Hair stylist',
    sub: 'Cuts, color, styling',
    image: require('@/assets/brand/industry-hair.webp'),
    bufferMinutes: 10,
    slotStepMinutes: 15,
    starters: [
      { name: 'Haircut & style', durationMinutes: 60, priceCents: 6500 },
      { name: 'Silk press', durationMinutes: 90, priceCents: 9500, depositCents: 2000 },
      { name: 'Color consultation', durationMinutes: 30, priceCents: 0 },
    ],
  },
  {
    id: 'nails',
    label: 'Nail technician',
    sub: 'Manicures, sets',
    image: require('@/assets/brand/industry-nails.webp'),
    bufferMinutes: 10,
    slotStepMinutes: 15,
    starters: [
      { name: 'Gel manicure', durationMinutes: 45, priceCents: 5500 },
      { name: 'Full set', durationMinutes: 90, priceCents: 8500, depositCents: 1500 },
      { name: 'Fill', durationMinutes: 60, priceCents: 5000 },
    ],
  },
  {
    id: 'detailing',
    label: 'Mobile detailer',
    sub: 'Interior, exterior',
    image: require('@/assets/brand/industry-detailing.webp'),
    bufferMinutes: 30,
    slotStepMinutes: 30,
    starters: [
      { name: 'Exterior wash & wax', durationMinutes: 90, priceCents: 9000 },
      { name: 'Interior refresh', durationMinutes: 120, priceCents: 12000 },
      { name: 'Full detail', durationMinutes: 240, priceCents: 24000, depositCents: 5000 },
    ],
  },
  {
    id: 'housekeeping',
    label: 'Housekeeper',
    sub: 'Homes, move-outs',
    image: require('@/assets/brand/industry-housekeeping.webp'),
    bufferMinutes: 30,
    slotStepMinutes: 30,
    starters: [
      { name: 'Standard clean', durationMinutes: 120, priceCents: 12000 },
      { name: 'Deep clean', durationMinutes: 180, priceCents: 18000, depositCents: 3000 },
      { name: 'Move-out clean', durationMinutes: 240, priceCents: 26000, depositCents: 5000 },
    ],
  },
  {
    id: 'events',
    label: 'Decor & rentals',
    sub: 'Parties, events',
    image: require('@/assets/brand/industry-events.webp'),
    bufferMinutes: 60,
    slotStepMinutes: 30,
    starters: [
      { name: 'Event consultation', durationMinutes: 60, priceCents: 0 },
      { name: 'Setup & styling', durationMinutes: 180, priceCents: 35000, depositCents: 10000 },
      { name: 'Rental delivery & pickup', durationMinutes: 120, priceCents: 15000 },
    ],
  },
  {
    id: 'other',
    label: 'Something else',
    sub: 'Any appointment',
    image: require('@/assets/brand/banner-bg.webp'),
    bufferMinutes: 0,
    slotStepMinutes: 30,
    starters: [{ name: 'Standard appointment', durationMinutes: 60, priceCents: 5000 }],
  },
];

export function industryById(id: IndustryId): Industry {
  return INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[INDUSTRIES.length - 1];
}
