# Minimal Scaffold

Date: 2026-03-25

## What Was Created

- `content-types/H5P.WorkbenchPlaceholder-0.1/`
  - Minimal custom H5P library scaffold.
- `content-instances/workbench-placeholder-package/`
  - Minimal matching package-style instance scaffold.

## File Purpose

- `content-types/H5P.WorkbenchPlaceholder-0.1/library.json`
  - Declares the placeholder library metadata and preloaded JavaScript.
- `content-types/H5P.WorkbenchPlaceholder-0.1/semantics.json`
  - Defines one editable text field for the placeholder content.
- `content-types/H5P.WorkbenchPlaceholder-0.1/scripts/workbench-placeholder.js`
  - Minimal runtime that renders the placeholder message into the H5P container.
- `content-instances/workbench-placeholder-package/h5p.json`
  - Declares package-level metadata and dependency on the placeholder library.
- `content-instances/workbench-placeholder-package/content/content.json`
  - Supplies the instance data for the single placeholder field.

## Placeholder Status

- This is not a real activity.
- No Money Basics content was added.
- No editor packaging, build automation, icons, styles, or translations were added.
- The scaffold exists only to validate library and instance structure.

## Next Validation Step

Assemble a disposable test package in `packages/` that combines this library folder with the instance folder, then open it in Lumi or another H5P-compatible environment to confirm the library is recognized and the placeholder message renders.
