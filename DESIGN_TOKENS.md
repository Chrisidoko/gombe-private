<div style="background:#ffffff; padding:32px; font-family:'Segoe UI',sans-serif; color:#151D48;">

# Gombe — Design Reference

Shared colour and typography reference for Gombe State digital products

---

## Typography

### Primary Font

**Poppins** (Google Fonts)

| Weight | Class / Usage                         |
| ------ | ------------------------------------- |
| 200    | Extra Light — rarely used             |
| 300    | Light — subtitles, captions           |
| 400    | Regular — body text, labels           |
| 500    | Medium — form labels, table cells     |
| 600    | Semi Bold — card headings, nav labels |
| 700    | Bold — page titles, key figures       |

**CSS variable:** `--font-poppins`  
**Fallback:** `sans-serif`

---

## Colour Palette

### Brand Green (Primary)

The main identity colour used for buttons, active states, links, and the sidebar.

| Swatch                                                                                                                                              | Name               | Hex       | Usage                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------- | ---------------------------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#28a745;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Brand Green        | `#28a745` | Primary CTA buttons, active nav, links, badges |
| <span style="display:inline-block;width:24px;height:24px;background:#218838;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Brand Green Dark   | `#218838` | Button hover state                             |
| <span style="display:inline-block;width:24px;height:24px;background:#23913b;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Brand Green Deeper | `#23913b` | Alternate button hover                         |
| <span style="display:inline-block;width:24px;height:24px;background:#166534;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Forest Green       | `#166534` | Dark button variant, footer accents            |
| <span style="display:inline-block;width:24px;height:24px;background:#1a5c2e;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Deep Forest        | `#1a5c2e` | Gradient start, sidebar backgrounds            |
| <span style="display:inline-block;width:24px;height:24px;background:#154a26;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Darkest Green      | `#154a26` | Deep gradient, icon backgrounds                |
| <span style="display:inline-block;width:24px;height:24px;background:#052e16;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Midnight Green     | `#052e16` | Gradient end (darkest shade)                   |
| <span style="display:inline-block;width:24px;height:24px;background:#199b39;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Mid Green          | `#199b39` | Background watermarks, overlays                |
| <span style="display:inline-block;width:24px;height:24px;background:#1c9b39;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Mid Green Alt      | `#1c9b39` | Alternate mid-tone green                       |
| <span style="display:inline-block;width:24px;height:24px;background:#16a34a;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Bright Green       | `#16a34a` | Success headings in emails                     |
| <span style="display:inline-block;width:24px;height:24px;background:#15803d;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Muted Green        | `#15803d` | Subtle green text                              |

**Tailwind green scale used:**

| Swatch                                                                                                                                              | Token       | Approx Hex | Usage                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- | ---------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#f0fdf4;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-50`  | `#f0fdf4`  | Light green backgrounds      |
| <span style="display:inline-block;width:24px;height:24px;background:#dcfce7;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-100` | `#dcfce7`  | Badge backgrounds            |
| <span style="display:inline-block;width:24px;height:24px;background:#bbf7d0;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-200` | `#bbf7d0`  | Borders, tinted backgrounds  |
| <span style="display:inline-block;width:24px;height:24px;background:#4ade80;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-400` | `#4ade80`  | Icons, indicators            |
| <span style="display:inline-block;width:24px;height:24px;background:#22c55e;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-500` | `#22c55e`  | Mid-tone accents             |
| <span style="display:inline-block;width:24px;height:24px;background:#16a34a;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-600` | `#16a34a`  | Active states, hover targets |
| <span style="display:inline-block;width:24px;height:24px;background:#15803d;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-700` | `#15803d`  | Deep hover, gradient ends    |
| <span style="display:inline-block;width:24px;height:24px;background:#166534;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-800` | `#166534`  | Dark text on light green     |
| <span style="display:inline-block;width:24px;height:24px;background:#14532d;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `green-900` | `#14532d`  | Darkest text                 |

---

### Neutral Grey (Base UI)

Used for text, borders, surfaces, and backgrounds throughout.

| Swatch                                                                                                                                              | Token      | Approx Hex | Usage                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ---------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#f9fafb;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-50`  | `#f9fafb`  | Page backgrounds, table rows |
| <span style="display:inline-block;width:24px;height:24px;background:#f3f4f6;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-100` | `#f3f4f6`  | Hover backgrounds, dividers  |
| <span style="display:inline-block;width:24px;height:24px;background:#e5e7eb;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-200` | `#e5e7eb`  | Card borders, input borders  |
| <span style="display:inline-block;width:24px;height:24px;background:#d1d5db;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-300` | `#d1d5db`  | Subtle borders               |
| <span style="display:inline-block;width:24px;height:24px;background:#9ca3af;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-400` | `#9ca3af`  | Placeholder text, disabled   |
| <span style="display:inline-block;width:24px;height:24px;background:#6b7280;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-500` | `#6b7280`  | Secondary text               |
| <span style="display:inline-block;width:24px;height:24px;background:#4b5563;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-600` | `#4b5563`  | Body text                    |
| <span style="display:inline-block;width:24px;height:24px;background:#374151;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-700` | `#374151`  | Strong body text             |
| <span style="display:inline-block;width:24px;height:24px;background:#1f2937;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-800` | `#1f2937`  | Dark headings                |
| <span style="display:inline-block;width:24px;height:24px;background:#111827;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `gray-900` | `#111827`  | Near-black text              |

---

### Custom Text / UI Colours

| Swatch                                                                                                                                              | Name            | Hex       | Usage                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------- | --------------------------------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#151D48;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Navy Foreground | `#151D48` | Global foreground (`--foreground`), dashboard stats |
| <span style="display:inline-block;width:24px;height:24px;background:#687799;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Muted Blue-Grey | `#687799` | Secondary text in tables                            |
| <span style="display:inline-block;width:24px;height:24px;background:#737791;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Slate Grey      | `#737791` | Supplementary labels                                |
| <span style="display:inline-block;width:24px;height:24px;background:#81859C;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Soft Grey       | `#81859C` | Caption text                                        |
| <span style="display:inline-block;width:24px;height:24px;background:#0055FF;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Accent Blue     | `#0055FF` | Link text                                           |
| <span style="display:inline-block;width:24px;height:24px;background:#E6EEFF;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Light Blue Tint | `#E6EEFF` | Badge backgrounds, info chips                       |
| <span style="display:inline-block;width:24px;height:24px;background:#F8F9FA;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Near White      | `#F8F9FA` | Alternate card backgrounds                          |
| <span style="display:inline-block;width:24px;height:24px;background:#ffffff;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | White           | `#ffffff` | Surfaces, modals, cards                             |

---

### Status / Semantic Colours

#### Red — Danger / Error / Rejection

| Swatch                                                                                                                                              | Token     | Approx Hex | Usage                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- | ------------------------------ |
| <span style="display:inline-block;width:24px;height:24px;background:#fef2f2;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `red-50`  | `#fef2f2`  | Error message backgrounds      |
| <span style="display:inline-block;width:24px;height:24px;background:#fee2e2;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `red-100` | `#fee2e2`  | Light error tint               |
| <span style="display:inline-block;width:24px;height:24px;background:#fecaca;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `red-200` | `#fecaca`  | Error borders                  |
| <span style="display:inline-block;width:24px;height:24px;background:#f87171;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `red-400` | `#f87171`  | Error icons                    |
| <span style="display:inline-block;width:24px;height:24px;background:#ef4444;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `red-500` | `#ef4444`  | Error text                     |
| <span style="display:inline-block;width:24px;height:24px;background:#dc2626;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `red-600` | `#dc2626`  | Strong error, rejection badges |
| <span style="display:inline-block;width:24px;height:24px;background:#b91c1c;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `red-700` | `#b91c1c`  | Hover on red buttons           |

Custom reds:

| Swatch                                                                                                                                              | Hex       | Usage                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#D33833;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `#D33833` | Reject button fill              |
| <span style="display:inline-block;width:24px;height:24px;background:#dc3545;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `#dc3545` | Bootstrap-style danger (legacy) |
| <span style="display:inline-block;width:24px;height:24px;background:#ff003a;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `#ff003a` | Alert indicators                |

---

#### Amber — Warning

| Swatch                                                                                                                                              | Token       | Approx Hex | Usage                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- | ---------------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#fffbeb;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `amber-50`  | `#fffbeb`  | Background tints                   |
| <span style="display:inline-block;width:24px;height:24px;background:#fef3c7;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `amber-100` | `#fef3c7`  | Badge backgrounds                  |
| <span style="display:inline-block;width:24px;height:24px;background:#fde68a;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `amber-200` | `#fde68a`  | Badge borders                      |
| <span style="display:inline-block;width:24px;height:24px;background:#f59e0b;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `amber-500` | `#f59e0b`  | Avatar gradient, warning accents   |
| <span style="display:inline-block;width:24px;height:24px;background:#d97706;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `amber-600` | `#d97706`  | Active nav accent, warning buttons |
| <span style="display:inline-block;width:24px;height:24px;background:#b45309;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `amber-700` | `#b45309`  | Hover states                       |
| <span style="display:inline-block;width:24px;height:24px;background:#92400e;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `amber-800` | `#92400e`  | Dark text on amber                 |
| <span style="display:inline-block;width:24px;height:24px;background:#fbbf24;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | Custom      | `#fbbf23`  | Amber accent fills                 |

---

#### Blue — Info / Links / Filters

| Swatch                                                                                                                                              | Token        | Approx Hex | Usage                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | -------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#eff6ff;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `blue-50`    | `#eff6ff`  | Info backgrounds           |
| <span style="display:inline-block;width:24px;height:24px;background:#dbeafe;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `blue-100`   | `#dbeafe`  | Info tint                  |
| <span style="display:inline-block;width:24px;height:24px;background:#60a5fa;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `blue-400`   | `#60a5fa`  | Info icons                 |
| <span style="display:inline-block;width:24px;height:24px;background:#3b82f6;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `blue-500`   | `#3b82f6`  | Focus rings                |
| <span style="display:inline-block;width:24px;height:24px;background:#2563eb;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `blue-600`   | `#2563eb`  | Active states, links       |
| <span style="display:inline-block;width:24px;height:24px;background:#1d4ed8;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `blue-700`   | `#1d4ed8`  | Hover on blue elements     |
| <span style="display:inline-block;width:24px;height:24px;background:#a5b4fc;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `indigo-300` | `#a5b4fc`  | Filter bar borders         |
| <span style="display:inline-block;width:24px;height:24px;background:#4f46e5;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `indigo-600` | `#4f46e5`  | Active filter, focus rings |

---

#### Purple — Analytics / Chart Accents

| Swatch                                                                                                                                              | Token        | Approx Hex | Usage               |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:#faf5ff;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `purple-50`  | `#faf5ff`  | Card backgrounds    |
| <span style="display:inline-block;width:24px;height:24px;background:#ede9fe;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `purple-100` | `#ede9fe`  | Tinted backgrounds  |
| <span style="display:inline-block;width:24px;height:24px;background:#c084fc;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `purple-400` | `#c084fc`  | Chart series colour |
| <span style="display:inline-block;width:24px;height:24px;background:#a855f7;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `purple-500` | `#a855f7`  | Chart accent        |
| <span style="display:inline-block;width:24px;height:24px;background:#9333ea;border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `purple-600` | `#9333ea`  | Strong purple text  |

---

### Overlay / Gradient Values

| Swatch                                                                                                                                                              | Value                     | Usage                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------- |
| <span style="display:inline-block;width:24px;height:24px;background:rgba(25,155,57,0.9);border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span>     | `rgba(25,155,57,0.9)`     | Green overlay — auth and entry screens |
| <span style="display:inline-block;width:24px;height:24px;background:rgba(25,155,57,1.0);border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span>     | `rgba(25,155,57,1.0)`     | Solid green gradient end               |
| <span style="display:inline-block;width:24px;height:24px;background:rgba(25,155,57,0.2);border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span>     | `rgba(25,155,57,0.2)`     | Light green glass tint                 |
| <span style="display:inline-block;width:24px;height:24px;background:rgba(255,255,255,0.9);border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span>   | `rgba(255,255,255,0.9)`   | White frosted overlay                  |
| <span style="display:inline-block;width:24px;height:24px;background:rgba(238,238,238,0.302);border-radius:4px;border:1px solid #ccc;vertical-align:middle;"></span> | `rgba(238,238,238,0.302)` | Subtle grey overlay                    |

---

## CSS Variables

Defined in `globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #151d48;
}
```

---
