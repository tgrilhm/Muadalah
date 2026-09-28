---
name: Muadalah Management
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#952200'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf3003'
  on-tertiary-container: '#ffddd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#891e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  success-hadir: '#10B981'
  warning-izin: '#F59E0B'
  danger-alfa: '#EF4444'
  surface-card: '#FFFFFF'
  text-main: '#0D0C22'
  border-subtle: '#E2E8F0'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built for a multi-school student management ecosystem. The brand personality is **authoritative yet accessible**, combining the reliability required for educational administration with a modern, effortless user experience. 

The aesthetic follows a **Modern Corporate** style characterized by:
- **Clarity & Efficiency:** High whitespace and a structured information hierarchy to reduce cognitive load for administrators and teachers.
- **Soft Precision:** High-radius corners paired with crisp, systematic typography.
- **Data-Centricity:** Card-based layouts that prioritize readability and glanceable metrics.
- **Trust:** A dominant vibrant blue palette that conveys professionalism and stability.

## Colors

The palette is anchored by a vibrant blue, used for primary actions and brand presence. The neutral system uses "Slate" grays to provide a sophisticated, low-fatigue background for long-term daily use.

- **Primary Blue:** Used for headers, active navigation states, and primary buttons.
- **Semantic Statuses:** 
    - **Hadir (Success):** Emerald green for attendance and positive completion.
    - **Izin/Sakit (Warning):** Amber for neutral status changes requiring attention.
    - **Alfa/Tunggakan (Danger):** Bright red for absences or urgent financial arrears.
- **Surface & Background:** The main background is a very light gray (#F8FAFC) to make the pure white cards pop, creating a distinct visual "layering" effect.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy environments. The scale is designed to handle both high-level dashboard summaries and dense student records.

- **Weight Usage:** Use **Semi-bold (600)** for sub-headers and button labels to ensure they stand out against body text.
- **Vertical Rhythm:** Line heights are slightly generous (1.5 - 1.6) for body text to improve scanning speed when reading long student lists or notes.
- **Contextual Adaptation:** On mobile devices, `headline-lg` should scale down to `headline-md` (24px) to avoid excessive wrapping.

## Layout & Spacing

The layout utilizes a **Fixed Grid** model on large screens to maintain density and a **Fluid Grid** on smaller devices.

- **Grid System:** A 12-column grid for desktop with 24px gutters.
- **Card Padding:** All dashboard cards must use `lg` (24px) internal padding to ensure content feels breathable.
- **Information Density:** For data tables (Daftar Siswa), use `sm` vertical padding to maximize the number of visible rows without sacrificing touch targets.
- **Responsive Behavior:** 
    - **Desktop (>1200px):** Sidebar is pinned (280px width).
    - **Tablet (768px - 1199px):** Sidebar collapses to icons-only.
    - **Mobile (<767px):** Single column layout with 16px margins; sidebar becomes a bottom sheet or overlay menu.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and extremely soft **Ambient Shadows**.

- **Level 0 (Background):** The base canvas uses the Neutral color.
- **Level 1 (Cards/Surface):** White cards with a subtle border (#E2E8F0) and a soft shadow. The shadow should be barely perceptible: `0px 4px 20px rgba(0, 0, 0, 0.03)`.
- **Level 2 (Hover/Active):** When a card or element is interactive, the shadow deepens to `0px 8px 30px rgba(0, 0, 0, 0.06)` to simulate physical lift.
- **Interactive Elements:** Buttons use a solid primary color but should have a small "glow" shadow matching the button color at 20% opacity when focused.

## Shapes

The design system uses a **Rounded** shape language to feel approachable and friendly.

- **Cards:** Use `rounded-xl` (24px) for main dashboard containers to match the modern aesthetic.
- **Inputs & Buttons:** Use `rounded-lg` (12px) to provide a distinct, comfortable interaction area.
- **Status Badges (Pills):** Use `rounded-full` for status indicators like "Hadir" or "Alfa" to make them instantly recognizable as secondary metadata.
- **Images/Avatars:** Student profile photos should always be circular to soften the UI.

## Components

### Buttons
- **Primary:** Full fill Blue, White text, Semi-bold.
- **Secondary:** White background, Blue border, Blue text.
- **Ghost:** No background/border, Grey text that turns Blue on hover.

### Inputs (Field Input)
- **Style:** Light gray fill (#F1F5F9) that turns White with a Blue border when focused.
- **Labels:** Always placed above the field in `label-md` style.

### Cards (Kartu Informasi)
- **Header:** Should include a title and an optional icon or "View All" (Lihat Semua) link.
- **Footer:** Use for summary actions or timestamps.

### Data Tables (Tabel Data)
- **Header:** Light gray background, all-caps labels.
- **Rows:** Subtle hover state (tinted background); alternating row colors are not required as borders provide sufficient separation.

### Navigation
- **Sidebar:** Vertical arrangement. Active item uses a solid Blue background with White text and a small left-aligned accent bar.
- **Icons:** Use consistent 2px stroke-width line icons (e.g., Lucide or Phosphor) to match the Inter typeface.

### Status Chips (Lencana Status)
- Use "Soft Fill" style: A background color at 10-15% opacity with text at 100% opacity of the semantic color (e.g., Green text on light green background for "Hadir").