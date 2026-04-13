# Exportability Analysis

Date: 2026-03-27

## First Data Point

- Source export reviewed:
  - `src/activities/Workshop 7/Debt Action Planner/future plan.html`
- Source activity type:
  - `H5P.DebtFuturePlan 0.1`
- Result:
  - High-confidence conversion target for standalone LearnWorlds HTML.

## Why This One Is High Confidence

- Single custom library under our control.
- Content structure is simple and explicit in `jsonContent`.
- No media assets.
- No nested H5P sub-content.
- No scoring, reporting, or xAPI-dependent user flow.
- No runtime orchestration beyond rendering four text fields.
- Standalone HTML can reproduce the learner experience directly without relying on H5P player chrome.

## Conversion Note

The Lumi "all-in-one HTML" export was not used as a publishable artifact. It was treated as a carrier for:

- library identity
- authored content values
- confirmation of the rendered H5P behavior

A separate LearnWorlds-safe HTML version was created here:

- `src/activities/Workshop 7/Debt Action Planner/future_plan_learnworlds_embed.html`

## Current Working Rule

Activities are strong conversion candidates when they:

- use a controlled custom library
- have a predictable schema
- rely on simple DOM rendering
- do not depend heavily on H5P runtime features outside basic rendering/state

Activities become lower-confidence candidates as they depend more on:

- nested sub-content
- media playback orchestration
- drag/drop or physics-like interactions
- quiz/reporting logic
- branching or timeline coordination
- H5P player chrome or runtime services
