# "The Stack" — staged narrative page — Slice 9 (design + plan)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** A new top-level "The Stack" tab that tells the project's story as a step-through animated build-up — a layered tower assembled one block at a time, each preceded by the problem it solves. Content is fully self-explanatory: reading it cold, with no presenter, conveys the whole narrative.

## Design

- **Interaction:** step-through. Next / Prev buttons + arrow keys (→ / Space advance, ← back). A progress indicator ("Step n / 8") and dots.
- **Animation:** Framer Motion. The left **narrative card** cross-fades between steps (`AnimatePresence`, mode `wait`). The right **stack tower** holds six layer blocks that animate between states (ghost → active → placed) as the step changes.
- **Self-explanatory:** every step shows a kicker, the problem/question as a heading, and a full explanatory paragraph (what the layer is, why it's needed, how it follows from the previous). A persistent header tells a cold visitor what the page is and to press Next. Each layer step links to its live demo tab.
- **Placement:** new section `TheStack`, added to the nav under "Start here". Default landing stays Overview.

**The six layers (bottom → top):** Compute → Runtimes → Model → Plumbing → I/O → RAG, then a final thesis step lighting the whole tower.

**Block states by the step's `activeLayer`:** `index < activeLayer` = placed (dimmed); `== activeLayer` = active (glow); `> activeLayer` = ghost (dashed outline). `activeLayer = -1` (intro) → all ghost; `= 6` (thesis) → all lit.

---

### Task 1: Add Framer Motion

- [ ] **Step 1:** add `"framer-motion": "^11.0.0"` to `apps/hub/package.json` dependencies.
- [ ] **Step 2:** `pnpm install` (add any ignored build scripts to `pnpm-workspace.yaml` if prompted).
- [ ] **Step 3:** commit `chore(hub): add framer-motion (Slice 9)`.

### Task 2: Build the `TheStack` section

- [ ] **Step 1:** Create `apps/hub/src/sections/TheStack.tsx` (full component below).
- [ ] **Step 2:** Register it in `apps/hub/src/App.tsx` — import, and add a `SECTIONS` entry in the "Start here" group.
- [ ] **Step 3:** `pnpm --filter @webai/hub build` → succeeds.
- [ ] **Step 4:** commit `feat(hub): "The Stack" staged narrative page (Slice 9)`.

**Component (`TheStack.tsx`):** see the implemented file — a `STEPS` array (8 self-explanatory steps), a `LAYERS` array (6 blocks), keyboard + button navigation, `AnimatePresence` for the card, and `motion.div` blocks whose `animate` props derive from each step's `activeLayer`.

---

## Self-review notes

- Content is self-contained prose per step (no reliance on a speaker).
- Framer Motion is the only new dep; lazy not required (small).
- Keyboard + buttons both drive the same `step` state; clamped to [0, 7].
- Deferred: auto-play toggle (for video capture) can be added later; RAG layer references the not-yet-built RAG tab.
