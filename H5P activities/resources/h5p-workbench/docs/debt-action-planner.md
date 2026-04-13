# Debt Action Planner

Date: 2026-03-25

## What Was Built

- `content-types/H5P.DebtActionPlanner-0.1/`
  - A minimal custom H5P library based on the Workshop 7 action-plan worksheet.
- `content-instances/debt-action-planner-demo/`
  - A matching sample instance for Lumi import and rendering checks.

## Simplification Choice

This implementation keeps the worksheet's actual learning structure:

- one action-plan step
- one future-planning step
- blank learner-entered fields

It intentionally drops the original standalone HTML chrome:

- page-ratio layout
- side navigation rail
- spotlight guide overlay
- reset button
- completion badges
- localStorage-specific behavior

## Files

- `library.json`
  - H5P library metadata and asset registration.
- `semantics.json`
  - Editor schema for the core prompts and row count.
- `scripts/debt-action-planner.js`
  - Runtime rendering for the two-step worksheet and H5P state capture.
- `styles/debt-action-planner.css`
  - Minimal layout and focus styling.
- `content/content.json`
  - Instance configuration for the sample Workshop 7 build.

## Validation Goal

Import the packaged sample into Lumi and confirm:

- the custom library is accepted
- both steps render
- learner-entered values can be typed into the fields
- step switching works cleanly

## Package

- `packages/workshop-07-debt-action-planner.h5p`

Open that package in Lumi to validate the current custom-library build.

## Next Step

If Lumi accepts this build, decide whether to keep the row count and prompts as-is or refine the authored text before adding any extra behavior.
