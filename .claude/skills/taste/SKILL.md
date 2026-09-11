---
name: taste
description: >
  Use when deciding or reviewing how an interface LOOKS — the aesthetic
  judgment calls with no single right answer. Covers typographic scale, weight
  and measure, spacing rhythm and grouping, color restraint, contrast, borders
  vs shadows vs elevation, radius consistency, density, alignment, motion
  duration and easing, and knowing what to delete. Trigger on "does this look
  right", "make it cleaner", "feels off", "too busy", "too plain", "pick a
  color", "what size should this be", "is this too much", or when choosing
  between two versions that both work. Appearance only — for behavior use `ux`,
  for out-of-distribution ambitious craft use `impeccable`.
argument-hint: "[screen or component to judge]"
user-invocable: true
---

# Taste — visual judgment

Taste is not decoration. It is the ability to tell which of two working options
is better, and to remove what is not carrying weight. Default stance:
**subtract first**. Most screens improve by deleting a border, a shadow, a
color, and a font size.

---

## 1. The one question

For every element on the screen: *what does this communicate that nothing else already communicates?*

No answer means delete it. This kills, in order of frequency:
decorative icons next to labels, borders inside already-spaced groups, shadows
on flat surfaces, a second accent color, a heading that repeats the page title,
and "helpful" subtext nobody reads.

---

## 2. Typography

- One family for UI. A second family only for a deliberate display or mono role, never for variety.
- Four sizes max on a screen. If you need a fifth, your hierarchy is wrong, not your scale.
- Hierarchy comes from **weight and color before size**. A 14px semibold on foreground beats a 20px regular for "this is the important one" — and costs no layout.
- Body measure: 45–75 characters. Long paragraphs at full container width are always wrong.
- Line height inversely tracks size: ~1.5 for body, ~1.2 for headings, 1.0 for numeric displays.
- Numbers in tables and stat tiles: tabular figures, right-aligned. Never let a column jitter.
- Never center more than two lines of text.
- All-caps only for labels under ~15 characters, and always with letter-spacing added.

---

## 3. Spacing

- One scale. 4px base, and use it — no 13px, no 7px.
- **Spacing is the grouping mechanism.** Related things sit closer than unrelated things. Get this right and you need no dividers.
- Gap between sections > gap between rows in a section > gap inside a row. If those three are equal, the page reads as mush.
- Padding is symmetric unless the optical weight demands otherwise (icon-leading buttons want slightly less left padding).
- Whitespace is not wasted space. Cramped is a failure mode; empty is a valid design.

---

## 4. Color

- One accent. It marks the primary action and the current selection — nothing else.
- Everything else is a neutral ramp. If a screen has more than the accent plus neutrals plus semantic states (success / warning / danger), it is decorated, not designed.
- Color never carries information alone. Pair it with a shape, an icon, or text.
- Contrast floor: 4.5:1 for body text, 3:1 for large text and for UI boundaries you actually need to see. Check it, do not eyeball it.
- Saturated color on large areas reads as loud. Saturate small, desaturate large.
- Dark mode is not inverted light mode. Elevation goes *lighter*, not shadowed; pure black backgrounds and pure white text both need pulling back.

**In this project**: preview colors come from CSS variables only, never hardcoded — sidebar chrome is the single exception and uses hex deliberately. See `buildThemeVars()` in `build-payload.ts`, which is the only config-to-CSS mapping.

---

## 5. Depth and edges

Escalate only as far as you need:

1. **Spacing** — no visual weight at all. Try this first.
2. **Background shift** — one step of the neutral ramp.
3. **Border** — 1px, low-contrast.
4. **Shadow** — only for things that genuinely float above the page (popover, dialog, dragged item).

Never combine 3 and 4 on the same element unless it is a floating layer over content.

- Radius is consistent per surface class, and nested radius is smaller than its parent, not equal.
- A 1px border at low contrast beats a heavy one every time. If you cannot see it, you may not need it.

---

## 6. Motion

- Duration: 100–150ms for state change (hover, press), 200–300ms for entrance/exit, 400ms+ for nothing.
- Easing: ease-out for entering, ease-in for leaving, linear only for continuous loops.
- Animate `transform` and `opacity`. Animating `width`, `height`, `top`, or `left` is a performance bug.
- Motion clarifies where a thing came from. Motion that only says "look, animation" is noise — cut it.
- Honor `prefers-reduced-motion`. Reduce to a fade, do not just disable.

---

## 7. Alignment and density

- Everything aligns to something. A single unaligned element makes a whole page look amateur.
- Pick one optical grid per region and hold it — labels align to labels, values align to values.
- Density follows use: a settings panel is calm and airy; a data table is tight and scannable. Applying one density everywhere is a tell.

---

## 8. Symptoms of bad taste

Scan for these; each is a fix, not an opinion:

- More than one accent color competing for the eye.
- Borders around things that are already separated by space.
- Shadows on non-floating elements.
- Five or more type sizes.
- Mixed radii on sibling elements.
- Icons that repeat the adjacent word.
- Centered body text.
- Uniform spacing between everything, so no grouping reads.
- Gradients or glass used for no structural reason.
- Placeholder-gray text used for real content.
- Full-width text at 1400px.
- Animation over 400ms on an action the user repeats.

---

## 9. Calibration when genuinely stuck

- Squint. What still reads is the hierarchy. If the wrong thing survives, fix that.
- Render at 50%. Structural problems survive scaling; detail problems do not.
- Delete the element and look again. If nothing is worse, it stays deleted.
- Check both light and dark, both extremes of density. Taste that only holds in one mode is not taste.
- When two options both work, pick the quieter one. It ages better and it composes with the next feature.

---

## 10. This project specifically

- The customizer's own chrome must never compete with the theme being previewed. The chrome is neutral by policy; the preview is where color lives.
- Preview fixtures (`showcase-block.tsx`) are deterministic module-level constants — they exist to show the theme, not to be interesting. Boring realistic content is correct.
- Chart palettes (`chart-palettes.ts`) need to hold up as a set at 3, 5, and 8 series, in both modes. Judge the whole ramp, never a single swatch.
- A picker swatch must read as the token it represents at the size it is rendered. If two options look identical in the grid, either the options are redundant or the swatch is too small.

---

## 11. Review output

One line per finding, worst first:

```
<file>:<line> — <what is off> -> <the change>
```

State the change, not a feeling. "Too busy" is not a finding; "three accent
colors in the toolbar, keep primary and neutralize the other two" is.
