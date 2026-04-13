# Workshop 7 Split Activities

Date: 2026-03-25

## Change

The earlier combined two-step prototype has been superseded by two separate H5P activities:

- `content-types/H5P.DebtActionPlan-0.1/`
- `content-types/H5P.DebtFuturePlan-0.1/`

## Why

The two parts are related, but they are not a sequential flow. Treating them as separate activities makes the authoring model cleaner and avoids implying that one must be completed before the other.

## Action Plan Layout Choice

The Action Plan table now uses a simpler table treatment:

- row separators instead of heavy full-cell grid lines
- standard table cells
- full-width inputs with `box-sizing: border-box`

That is the cleaner option here. The previous tighter grid made the text fields visually collide with the borders and did not add meaningful structure.

## Packages

- `packages/workshop-07-action-plan.h5p`
- `packages/workshop-07-future-plan.h5p`

## Lumi Check

Import each package separately in Lumi and confirm:

- the custom library is accepted
- the fields render cleanly
- typed values stay inside their visual bounds
- each activity works as a standalone worksheet
