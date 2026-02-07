# Text Diagram Style Guide

A visual language for ASCII diagrams on hem.so. These diagrams should feel like hand-drawn sketches on a dark canvas — minimal, clear, and distinctive.

## Core Principles

1. **Monospace everything** — All characters align to a grid
2. **Generous whitespace** — Let elements breathe (min 2 chars between boxes)
3. **Consistent borders** — Use box-drawing characters for clean lines
4. **Dark canvas aesthetic** — Designed for dark backgrounds

---

## Box Characters

```
┌──────────────────┐    Single-line box (primary)
│  Content here    │
└──────────────────┘

╔══════════════════╗    Double-line box (emphasis)
║  Important!      ║
╚══════════════════╝

┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐    Dashed box (optional/secondary)
╎  Maybe this      ╎
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

## Arrow Characters

```
Vertical:     │ ▼ ▲
              │
              ▼

Horizontal:   ──────►   ◄──────

Corners:      ┌───┐     ┐ ┌
              │   │     └─┘
              └───┘

Branching:    ─┬─   ─┼─   ─┴─
              │     │     │
```

## Layout Patterns

### Simple Flow (vertical)
```
┌─────────────────┐
│     Input       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Process      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Output      │
└─────────────────┘
```

### Side-by-Side Comparison
```
     BEFORE                        AFTER
     ──────                        ─────

┌─────────────────┐         ┌─────────────────┐
│  Manual work    │         │  Automated      │
│  takes 4 hrs    │         │  takes 10 min   │
└─────────────────┘         └─────────────────┘
```

### Branching/Decision
```
         ┌─────────────────┐
         │   Decision?     │
         └────────┬────────┘
                  │
         ┌───────┴───────┐
         │               │
         ▼               ▼
   ┌───────────┐   ┌───────────┐
   │   Yes     │   │    No     │
   └───────────┘   └───────────┘
```

### Hierarchical
```
                 ┌───────────────┐
                 │    Parent     │
                 └───────┬───────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   ┌───────────┐   ┌───────────┐   ┌───────────┐
   │  Child A  │   │  Child B  │   │  Child C  │
   └───────────┘   └───────────┘   └───────────┘
```

---

## Components

### Progress Bar (filled)
```
████████████████████████████████░░░░░░░░   75%
```

### Progress Bar (dotted)
```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░   60%
```

### Progress Bar (with label)
```
┌──────────────────────────────────────────────────┐
│ ████████████████████████████░░░░░░░░  Tedious    │
│ (4 hrs)                               work       │
├──────────────────────────────────────────────────┤
│ ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░  High-value │
│ (2 hrs)                               work       │
└──────────────────────────────────────────────────┘
```

### Timeline
```
○─────────●─────────○─────────○─────────○
Q1        Q2        Q3        Q4       Q1
2024     2024      2024      2024     2025
          ▲
       You are
        here
```

### Metrics/Stats
```
┌────────────────┬────────────────┬────────────────┐
│   METRIC A     │   METRIC B     │   METRIC C     │
│                │                │                │
│     127        │     84%        │    $12.5k      │
│   (+23%)       │   (+12pp)      │   (+$2.1k)     │
└────────────────┴────────────────┴────────────────┘
```

### List with Icons
```
│ ✓  Completed task
│ ○  In progress
│ ·  Not started
│ ✗  Blocked
```

### Quote/Callout Box
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  "We should analyze why we're losing deals"      │
│                                                  │
│  "We should track what competitors are doing"    │
│                                                  │
│  "We should get field feedback to product"       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Spacing Rules

1. **Minimum 2 characters** between adjacent boxes
2. **Minimum 1 blank line** above/below diagrams
3. **Center-align** text within boxes when possible
4. **Left-align** lists and multi-line content

## Character Reference

```
Box drawing:
  ┌ ┐ └ ┘ ─ │ ├ ┤ ┬ ┴ ┼
  ╔ ╗ ╚ ╝ ═ ║ ╠ ╣ ╦ ╩ ╬

Arrows:
  ← → ↑ ↓ ◄ ► ▲ ▼

Fills:
  █ ▓ ▒ ░ · ○ ● ◌

Bullets:
  • · ○ ● ◆ ◇ ■ □ ✓ ✗

Dividers:
  ─── ═══ ··· ╌╌╌ ┄┄┄
```

---

## Tips

1. **Test width** — Preview on mobile to ensure it fits or scrolls gracefully
2. **Use titles** — Put section headers above complex diagrams
3. **Keep it simple** — If a diagram needs explanation, it's too complex
4. **Consistent style** — Pick one box style per diagram
5. **Round numbers** — `~4 hrs` reads better than `3.7 hrs`

## Examples in the Wild

- Drew DeVault (drew.tech) — Heavy use of ASCII for technical diagrams
- Simon Willison — Text diagrams in blog posts
- Mermaid.js — Inspiration for structured diagrams (but we stay raw ASCII)
