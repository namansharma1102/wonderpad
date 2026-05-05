---
name: The Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#584237'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#8c7265'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4400'
  primary: '#994200'
  on-primary: '#ffffff'
  primary-container: '#c05400'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb690'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#615c4b'
  on-tertiary: '#ffffff'
  tertiary-container: '#7a7463'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#331100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ebe2cd'
  tertiary-fixed-dim: '#cec6b2'
  on-tertiary-fixed: '#1f1b0f'
  on-tertiary-fixed-variant: '#4b4637'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  reader-body:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  ui-body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  reader-width: 720px
---

## Brand & Style
The design system is anchored in **Modern Minimalism** with a focus on editorial clarity. It balances the high-energy warmth of a community-driven platform with the quiet, focused sophistication of a premium e-reader. 

The visual language emphasizes "Reading Flow"—removing digital clutter to allow the content to breathe. By utilizing generous whitespace and a "content-first" hierarchy, the system evokes a sense of calm and intellectual focus. The personality is approachable yet authoritative, ensuring users feel they are using a high-end literary tool rather than a generic document viewer.

## Colors
The palette is centered around "Wonderpad Orange," a vibrant accent used sparingly for calls to action and progress indicators. This is grounded by a deep Navy/Slate for primary text and high-contrast UI sections (like sidebars or footers), providing a premium weight to the interface.

Three distinct reading modes are supported:
- **Light:** Pure white background for maximum clarity in well-lit environments.
- **Sepia:** A soft, warm-toned filtered aesthetic to reduce eye strain and provide a classic "paper" feel.
- **Dark:** A deep charcoal (not pure black) to maintain legibility while minimizing light emission.

## Typography
This design system employs a dual-font strategy. **Inter** is the functional backbone, used for all UI elements, navigation, and metadata to ensure a clean, modern, and systematic feel. **Newsreader** is introduced specifically for the reading experience (the PDF text and book descriptions) to provide a literary, authoritative character that mimics high-end book publishing.

Line heights are intentionally generous to improve accessibility and focus. For the reader-body style, the 1.6 line height ensures a comfortable vertical rhythm for long-form reading.

## Layout & Spacing
The system utilizes a **Fixed Grid** approach for the reading experience to maintain optimal line lengths, while the browsing experience follows a fluid 12-column grid.

- **Browsing:** Elements are arranged with 24px gutters. Content cards should span 3 or 4 columns depending on viewport size.
- **Reading:** The central text column is capped at 720px to prevent eye fatigue. Sidebars are collapsible to allow for a "Focus Mode."
- **Rhythm:** All margins and paddings are multiples of 8px to maintain a strict geometric alignment.

## Elevation & Depth
Elevation is handled through **Low-Contrast Outlines** and **Tonal Layers** rather than heavy shadows. This maintains the minimal aesthetic.

- **Level 0 (Base):** The main background.
- **Level 1 (Cards/Containers):** A 1px border (#E2E8F0 in light mode) with no shadow.
- **Level 2 (Hover/Active):** A very soft, diffused ambient shadow (0px 4px 20px rgba(0,0,0,0.05)) to suggest interactivity.
- **Level 3 (Overlays/Menus):** Use a subtle backdrop blur (8px) on the container to maintain context of the underlying content without visual noise.

## Shapes
The design system adopts a **Pill-shaped (3)** roundedness strategy for primary interactive elements. This softens the "technical" feel of a web app and makes it feel more friendly and modern.

- **Buttons:** Always fully rounded (pill-shaped).
- **Input Fields:** Fully rounded or 12px (rounded-xl) to match the button language.
- **Cards:** Use a slightly more conservative 16px (rounded-xl) to maintain structure while appearing soft.
- **Avatars:** Always circular.

## Components

### Buttons
Primary buttons are pill-shaped, filled with Wonderpad Orange, and use white bold Inter text. Secondary buttons use a Navy/Slate outline with no fill.

### Cards
Book cards are clean with a 1px subtle border. The book cover is the hero, featuring 8px rounded corners. Metadata (title, author) is left-aligned using Inter UI-body.

### Reader Controls
The reader interface features a floating, pill-shaped toolbar at the bottom of the viewport. It includes:
- **Theme Toggle:** Circular icons representing Light, Sepia, and Dark modes.
- **Progress Slider:** A thin track in Slate with a Wonderpad Orange thumb and fill.
- **Typography Menu:** A popover allowing users to toggle between Serif (Newsreader) and Sans (Inter) for document overlays.

### Input Fields
Search bars and text inputs use a light gray background (#F1F5F9) with a 1px border that turns Wonderpad Orange on focus. Labels are always small-caps Inter.

### Progress Indicators
Reading progress is shown via a thin horizontal bar at the very top of the page, using the primary accent color to provide a constant but unobtrusive visual cue.
