# H5P Workbench

This folder is the active local H5P development workbench for Money Basics custom activity work.

## Purpose

- Keep new H5P-focused work separate from older site, content, and archive materials in the parent directory.
- Support a workflow where AI helps build stable custom H5P-compatible assets, while Lumi/H5P can later be used for library management, light editing, packaging, and sharing.

## Structure

- `references/`
  - `lumi-app/`: cloned upstream Lumi desktop app source for reference.
  - `h5p-nodejs-library/`: cloned upstream Lumi Education H5P Node.js library for server-side/reference development.
  - `h5p-spec-notes/`: local notes about H5P structure and workflow assumptions.
- `content-types/`: custom H5P libraries/content types to build here.
- `content-instances/`: example instances, `content.json`, and related instance assets.
- `packages/`: built `.h5p` packages or other export artifacts.
- `scratch/`: temporary experiments and throwaway prototypes.
- `docs/`: setup notes and workflow notes.

## Setup Performed

- Cloned `https://github.com/Lumieducation/Lumi.git` into `references/lumi-app/`.
- Cloned `https://github.com/Lumieducation/H5P-Nodejs-library.git` into `references/h5p-nodejs-library/`.
- Installed local npm dependencies in `references/h5p-nodejs-library/` with `npm install`.

## Intentional Choices

- The cloned Lumi app is present as a reference repo only. Its npm dependencies were not installed in this setup step because the Electron build toolchain is heavier and not required for the current H5P workbench baseline.
- Existing Money Basics materials in the parent directory were left in place when they appeared active or potentially relevant.
- Clearly unrelated or inactive items were moved into the parent `legacy/` folder instead of being deleted.

## Working Rules

- Put all new H5P development work inside this `h5p-workbench/` folder.
- Prefer H5P-native structure over standalone HTML when the goal is Lumi/H5P compatibility.
- Treat upstream repos in `references/` as read-mostly references unless you are intentionally testing or patching them.
- Keep packages and experiments out of the parent directory root.

## Suggested Next Step

Create a minimal custom content-type scaffold in `content-types/` and a matching sample instance in `content-instances/`, then validate the packaging path against Lumi/H5P expectations.
