# BookNoble brand guide

**Tagline:** Booked. Organized. Growing.
**Personality:** upscale, calm, trustworthy, industry-neutral (salons and detailers should feel equally at home).

## Color

| Token | Hex | Use |
|---|---|---|
| Deep Purple | `#170D35` | Brand surfaces, navigation, headers, splash |
| Royal Blue | `#2850D8` | Primary actions, selection, links, focus |
| Noble Gold | `#D9B56B` | Sparing accents: crown, active tab, highlights, “Pro”. Never body text on white (use `#7A5A16` there) |
| White | `#FFFFFF` | Content surfaces and text on dark |

Full light/dark palettes, all AA-checked, live in `src/theme/tokens.ts`. Rule of thumb: one gold moment per screen.

## Typography

- **Manrope** ExtraBold/Bold for display, titles, numbers
- **Inter** Regular/Medium/SemiBold for body, labels and controls
- Scale: Display 30, Title 24, Heading 17, Body 15, Small 13, Caption 11 (caps, tracked)

## Logo

A royal-blue calendar crowned in gold, with a white **B** inside and a gold “booked” dot. Drawn in code (`src/components/logo.tsx`) and rendered to:

- `assets/images/icon.png`: App Store icon (opaque, 1024)
- `assets/images/android-icon-*.png`: adaptive icon layers + monochrome
- `assets/images/splash-icon.png`, `favicon.png`
- `assets/brand/logo-mark.png`, `logo-lockup-dark.png`, `logo-lockup-light.png`

Keep clear space equal to the crown height; don't recolor the crown or place the mark on busy photos without a dark scrim.

## Imagery

Photography and backgrounds were generated with **fal.ai** using **Bria FIBO 2** (trained on licensed data, offered for commercial use). Prompts, request IDs and original URLs are recorded in `assets/brand/manifest.json` for provenance. Each image was reviewed. One events image with an anatomical defect was rejected and regenerated.

Style: editorial, warm natural light, deep purple / royal blue interiors with subtle gold, real-looking people, no text or logos in images. Industry set: hair, nails, mobile detailing, housekeeping, events, plus abstract splash and banner backgrounds.

The in-app copies are 768px WebP previews (small and sharp on phones). `npm run fetch:brand` downloads the full-resolution PNG originals while the fal URLs remain live. Run it from a network that can reach `v3b.fal.media`, then keep the files.

## Iconography

Line icons are drawn in code (`src/components/icon.tsx`, 24px grid, 2px stroke) and never AI-generated, so they stay crisp, accessible and theme-aware.

## Motion

| Moment | Motion | Where |
|---|---|---|
| Launch | Logo springs in, crown settles, wordmark fades; ~1.3 s, then cross-fades out | `brand-splash.tsx` |
| Onboarding | Image cross-fade + text slide, swipe or tap | `onboarding.tsx` |
| Dashboard | Cards stagger up; revenue bars grow | `FadeIn`, `revenue-hero.tsx` |
| Buttons | 0.97 spring press + light haptic | `Button` |
| Calendar | Day content fades on change | `calendar.tsx` |
| Confirmation | Circle pops, tick draws, gold ring ripples | `success-check.tsx` |
| Loading | Gentle skeleton pulse | `Skeleton` |

Every animation respects the OS Reduce Motion setting and never blocks input.
