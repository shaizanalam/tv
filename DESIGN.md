# DESIGN.md — Alam's Frame Design System & Protocol

> **Universal Design Specification for Alam's Frame (Personal Cinema)**  
> Conforming to the 9-Section Universal `DESIGN.md` Protocol, Apple Human Interface Guidelines (HIG), and Frontend Craft Standards.

---

## 1. Visual Theme & Atmosphere

### 1.1 Aesthetic Philosophy
**Direction: PERSONAL CINEMA & QUIET LUXURY.**
Alam's Frame treats private family memories as cinematic art. The experience combines:
- **Quiet Luxury:** Restrained, mature, museum-grade presentation that defers to authentic photography.
- **Cinematic Editorial Design:** Generous negative space, asymmetric typography, and tranquil multi-stop dark scrims.
- **Swiss Typographic Discipline:** High contrast, deliberate hierarchy, balanced line breaks (`text-wrap: balance`), and zero decorative noise.
- **Apple Fluid Motion:** Physics-based spring animations, interruptible state transitions, tactile press response, and gesture momentum.

### 1.2 The Three Dials
- **`DESIGN_VARIANCE: 7`** — Asymmetric spotlight hero composition, curated 16:10 landscape cards, editorial moment vignettes.
- **`MOTION_INTENSITY: 6`** — Tactile physical springs (Damping Ratio $\zeta = 0.85 - 1.0$, Response $T = 0.25 - 0.35\text{s}$), smooth 60fps GPU transforms (`scale`, `translate3d`, `opacity`).
- **`VISUAL_DENSITY: 3`** — Spacious and unhurried. Optimized for 10-foot television viewing distances (2.5m – 4.0m) as well as handheld mobile touch.

### 1.3 Lighting & Appearance
- **Dark-First Cinema Canvas:** Deep charcoal and near-black background (`#101113`) to maximize the dynamic range and colors of user photographs.
- **Zero Neon Glow:** Strictly no artificial purple, cyan, or magenta AI glow. Ambient glows are restrained warm champagne (`rgba(216, 198, 161, 0.35)`).

---

## 2. Color Palette & Semantic Tokens

| Token | Hex / Value | Semantic Role & Craft Usage |
|---|---|---|
| `background` | `#101113` | Deep charcoal canvas base; absorbs room reflections on OLED/LED TVs |
| `surface` | `#191B1F` | Elevated card surfaces, glass modals, and HUD containers |
| `surface-hover` | `#22252A` | Interactive hover and active focus highlight states |
| `border-subtle` | `#303238` | Structural hairline dividers (`1px solid #303238`) |
| `border-glass` | `rgba(255, 255, 255, 0.10)` | Specular highlights on translucent frosted panels |
| `text-primary` | `#F5F5F2` | Warm ivory editorial headlines and high-priority titles (WCAG AAA) |
| `text-secondary` | `#E5E2DC` | Descriptive subtitles and narrative summaries |
| `text-muted` | `#A3A6AD` | Metadata badges, timestamps, and secondary captions |
| `accent-gold` | `#D8C6A1` | Reserved champagne gold for active tabs, remote focus rings, and primary CTA |
| `accent-hover` | `#E5D7B8` | Lightened champagne for active mouse/remote hover feedback |
| `scrim-dark` | `rgba(16, 17, 19, 0.95)` | Multi-stop gradient scrim behind text for guaranteed 10-foot legibility |

---

## 3. Typography Hierarchy

### 3.1 Type Families
- **Display & Headlines:** Editorial Serif (`font-serif`, Georgia / New York / Playfair fallback) for album titles and heroic headlines.
- **Interface & Body:** Clean Modern Sans (`font-sans`, SF Pro / Inter / system-ui fallback) with neutral kerning.
- **Metadata & Badges:** Monospace (`font-mono`, SF Mono / JetBrains Mono fallback) for year chips, clip counters, and technical hints.

### 3.2 Type Scale & 10-Foot Legibility Rules
| Level | Desktop / Web | TV (10-Foot Distance) | Mobile | Leading & Tracking |
|---|---|---|---|---|
| **Hero Title** | `text-5xl` (48px) | `text-6xl` (60px) | `text-3xl` (30px) | `tracking-tight leading-[1.05]` |
| **Hero Subtitle** | `text-lg` (18px) | `text-xl` (20px) | `text-sm` (14px) | `leading-relaxed text-[#E5E2DC]` |
| **Section Title** | `text-sm` (14px) | `text-sm` (14px) | `text-xs` (12px) | `tracking-wider uppercase font-semibold` |
| **Card Title** | `text-sm` (14px) | `text-base` (16px) | `text-xs` (12px) | `tracking-tight font-semibold text-[#F5F5F2]` |
| **Metadata Line** | `text-xs` (12px) | `text-sm` (14px) | `text-[11px]` (11px) | `text-[#A3A6AD]` |

*Rule:* All headlines must enforce `text-wrap: balance` to eliminate single-word orphans.

---

## 4. Component Standards

### 4.1 Buttons & Action CTAs
- **Primary Action (Play Collection):** Solid champagne background (`bg-[#D8C6A1] text-[#101113]`), rounded-full, with tactile press `:active` (`scale-[0.97]`).
- **Secondary Action (Explore Photos / Watch Videos):** Frosted glass surface (`bg-[#191B1F]/90 border border-[#303238] text-[#F5F5F2]`), rounded-full.
- **TV Focus Ring:** High-contrast double ring (`border-2 border-[#D8C6A1] ring-4 ring-[#D8C6A1]/50 ring-offset-4 ring-offset-[#101113] scale-105 shadow-[0_0_36px_rgba(216,198,161,0.45)]`).

### 4.2 Collection Cards (16:10 Aspect Ratio)
- **Dimensions:** Consistent 16:10 widescreen proportion (`aspect-[16/10]`) across all 6 verified collections.
- **Single Count Discipline:** Exactly one media count pill per card (positioned top-left: `px-2.5 py-0.5 rounded-full bg-[#101113]/85 text-[#D8C6A1]`). No duplicate count in the bottom metadata.
- **Selected & Focused State:**
  - Focused: `scale-[1.08] z-30 border-2 border-[#D8C6A1] shadow-[0_0_40px_rgba(216,198,161,0.4),0_24px_60px_rgba(0,0,0,0.95)] ring-2 ring-[#D8C6A1]/60`.
  - Unfocused (during carousel navigation): `opacity-50 scale-[0.98] border-[#303238] hover:opacity-85 transition-all duration-300`.

### 4.3 Highlight Moments Row
- **Widescreen 16:10 Miniatures:** Expanded thumbnail cards (`w-24 h-16 sm:w-28 sm:h-18 lg:w-32 lg:h-20`).
- **Focus Path:** Directly navigable from carousel via Down Arrow (`↓`), illuminating the row header in champagne gold (`text-[#D8C6A1]`).

---

## 5. Layout & Spatial Cadence

### 5.1 TV Safe Area & Overscan
- **5% TV Overscan Margin:** Minimum horizontal padding `px-4 sm:px-6 lg:px-12` and vertical padding `py-4 sm:py-6` to ensure no UI gets clipped on physical televisions.
- **Viewport Stability:** Root container set to `min-h-[100dvh]` (never raw `h-screen`) to prevent mobile browser URL bar jump.

### 5.2 Responsive Layout Blueprint
1. **Television (10-Foot Interface):** Widescreen 6-column grid (`sm:grid-cols-3 lg:grid-cols-6`), large D-pad targets, hero reacts dynamically on card hover/focus.
2. **Desktop:** Mouse hover elevation (`whileHover={{ y: -3 }}`), keyboard shortcuts (`← / →`, `Space / Enter`, `Esc`).
3. **Mobile Phone:** Touch-optimized snap carousel (`snap-x snap-mandatory overflow-x-auto w-[68vw]`), 44×44px minimum tap targets, swipe gestures.

---

## 6. Depth, Materials & Liquid Glass

```css
/* Specular Liquid Glass Frosted Material */
.cinema-glass {
  background: rgba(25, 27, 31, 0.85);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45);
}

/* Focused TV Card Diffuse Elevation */
.tv-focus-glow {
  box-shadow: 0 0 40px rgba(216, 198, 161, 0.40),
              0 24px 60px rgba(0, 0, 0, 0.95);
}
```

---

## 7. Motion & Physics Tokens (Framer Motion / Motion v12+)

```ts
export const MotionTokens = {
  // Apple HIG Fluid Springs
  springSettle: { type: 'spring', stiffness: 380, damping: 30 },
  springSnappy: { type: 'spring', stiffness: 450, damping: 32 },
  springGentle: { type: 'spring', stiffness: 280, damping: 28 },

  // Micro-interactions
  buttonTap: { scale: 0.97 },
  cardHover: { y: -3 },
  cardFocus: { scale: 1.08 },

  // Fade Crossfades
  crossfade: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
};
```

---

## 8. Anti-Patterns & Hard Rules

- **NO Neon Purple/Pink Blobs:** Strictly forbidden. Stick to champagne `#D8C6A1`, warm ivory `#F5F5F2`, and deep charcoal `#101113`.
- **NO Generic Glass Everywhere:** Only use frosted glass on floating UI elements (HUDs, badges, modals). Never blur user photography unnecessarily.
- **NO Button Text Wrapping:** Action buttons must remain on a single line at all viewports.
- **NO Duplicate Card Badges:** Exactly one photo/video count per card.
- **NO Black Frame on Video Load:** Video player must show a crisp high-res poster underlay until `currentTime > 0.2s`.
- **NO 1-Second Stutter Loops:** Player must maintain a 5-second buffer cushion before unpausing.

---

## 9. Verification & Pre-Flight Standards

- [x] WCAG AA contrast ratio (> 4.5:1 text, > 3:1 controls) across all screens.
- [x] All 6 collections (Dubai 2025, Ajmer Agra 25, Meccah & Madina, GoPro-Exports, Pachmari, Nautanki Resort) correctly wired.
- [x] D-pad remote navigation (`←`, `→`, `↑`, `↓`, `Enter`, `Back/Esc`) verified.
- [x] Mobile touch gestures (horizontal swipe, tap to toggle HUD) verified.
- [x] Server-side video disk cache and range streaming verified.

