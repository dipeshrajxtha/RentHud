# HAIKEI Asset Workflow & Integration Guide for RentHub

## 1. Overview
[Haikei](https://haikei.app) is an interactive, browser-based design generator for customizable SVG shapes, backgrounds, waves, and patterns.

> **Important Setup Note**: Haikei is **not an npm dependency** or CLI package; it is a design resource generator. Attempting to install it via npm or yarn is invalid. This document establishes the official workflow, brand configurations, and asset pipeline for incorporating Haikei assets into RentHub.

---

## 2. RentHub Brand Design Direction
When creating assets with Haikei for RentHub, adhere strictly to the **trustworthy, blue-led property technology identity**:

* **Primary Palette**: Deep Navy / Brand Blue (`#0259A1`, `#0C8EE9`, `#072849`), Slate Blue (`#1E293B`, `#334155`), Soft Background Ice (`#F0F7FF`, `#E0EFFE`, `#F8FAFC`).
* **Tone**: Crisp, architectural, professional, subtle.
* **Opacity & Weight**: Background SVGs must remain ultra-subtle (`opacity-5` to `opacity-20` max). Never let background shapes compete with property listings, data tables, or legal lease text.
* **Avoid**:
  * Neon or glitch gradients
  * Excessive or dramatic blobs that create visual clutter
  * Cartoonish styling
  * High-contrast background patterns that violate WCAG 2.1 AA text readability

---

## 3. Recommended Haikei Generators for RentHub

| Generator | Recommended Use Case in RentHub | Tuning Parameters |
| :--- | :--- | :--- |
| **Layered Waves** | Subtle section dividers (e.g. Hero to Feature grid) | Complexity: Low (2-3 layers), Soft curves, Low height |
| **Layered Steps** | Floor plan / multi-floor visual tiers, architectural cards | Low contrast, 2-3 steps, muted palette |
| **Polygon / Low Poly** | Geospatial / PostGIS search hero accent card backgrounds | Low contrast variation, subdued opacity (`#F0F7FF` to `#E0EFFE`) |
| **Subtle Blobs** | Accent glow behind primary action metrics / trust badges | Blurred (`filter: blur(40px)`), opacity < 15% |

---

## 4. Asset Export & Project Location Pipeline

1. **Generation**:
   - Open [haikei.app](https://haikei.app) in your browser.
   - Select the desired generator.
   - Enter RentHub hex codes:
     - `brand-50`: `#F0F7FF`
     - `brand-100`: `#E0EFFE`
     - `brand-500`: `#0C8EE9`
     - `brand-700`: `#0259A1`
     - `slate-100`: `#F1F5F9`
   - Adjust viewport to standard desktop (`1440x320` for dividers, `800x600` for cards).

2. **Export**:
   - Choose **SVG** format.
   - Ensure "Optimize SVG" is checked if available, or clean unnecessary `<defs>` and ids.

3. **Storage in Project**:
   - Static public assets: `web/public/patterns/`
   - Reusable React component SVGs: `web/src/assets/svg/haikei/`

---

## 5. React / Tailwind Integration Examples

### Example A: Static Background Divider
```tsx
import waveDivider from '@/assets/svg/haikei/subtle-wave-divider.svg';

export function SectionDivider() {
  return (
    <div className="w-full overflow-hidden leading-none pointer-events-none opacity-40">
      <img
        src={waveDivider}
        alt=""
        aria-hidden="true"
        className="w-full h-auto object-cover"
      />
    </div>
  );
}
```

### Example B: Inline SVG with Tailwind Dynamic Classes
```tsx
export function HeroBackgroundMesh() {
  return (
    <svg
      viewBox="0 0 900 600"
      className="absolute inset-0 -z-10 h-full w-full stroke-slate-200/50 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
      aria-hidden="true"
    >
      {/* Generated paths from Haikei */}
    </svg>
  );
}
```
