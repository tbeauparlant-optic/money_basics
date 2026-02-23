# Migration Map (Legacy -> Rebuild Layer)

| Legacy Path | Rebuild Path |
|---|---|
| `Materials/` | `main/rebuild/src/site/materials/` |
| `Whole/` | `main/rebuild/content/legacy/whole/` |
| `Parts/` | `main/rebuild/content/legacy/parts/` |
| `worksheets/` | `main/rebuild/content/legacy/worksheets/` |
| `PDP_Activity/` | `main/rebuild/content/legacy/pdp_activity/` |
| `SCORM_Activities/` | `main/rebuild/content/legacy/scorm_activities/` |
| `glossary/` | `main/rebuild/content/glossary/raw/` |
| `tools/` | `main/rebuild/tools/legacy/` |
| top-level files (`index.html`, `site_config.json`, etc.) | `main/rebuild/legacy/root/` |

## Reverse-engineered activity example

- Modularized copy of `Materials/Workshop_04/activity/index.html` now lives in:
  - `main/rebuild/src/activities/check-explainer/index.html`
  - `main/rebuild/src/activities/check-explainer/styles.css`
  - `main/rebuild/src/activities/check-explainer/app.js`
  - `main/rebuild/src/activities/check-explainer/data/hotspots.json`
  - `main/rebuild/src/activities/check-explainer/assets/...`
