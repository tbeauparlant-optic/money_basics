#!/usr/bin/env python3
"""Regenerate the GitHub Pages index for final H5P activity HTML packages."""

from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import quote


REPO_ROOT = Path(__file__).resolve().parents[1]
FINAL_DIR = REPO_ROOT / "H5P activities" / "final"
PAGES_BASE = "https://tbeauparlant-optic.github.io/money_basics/"


def title_from_html(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(r'"jsonContent":"((?:\\.|[^"\\])*)"', text)
    if match:
        try:
            json_content = json.loads(f'"{match.group(1)}"')
            payload = json.loads(json_content)
            if isinstance(payload.get("title"), str) and payload["title"].strip():
                return payload["title"].strip()
        except json.JSONDecodeError:
            pass

    match = re.search(r'"metadata":\s*\{[^{}]*"title":"((?:\\.|[^"\\])*)"', text)
    if match:
        try:
            return json.loads(f'"{match.group(1)}"').strip()
        except json.JSONDecodeError:
            pass

    return path.stem.replace("-", " ").title()


def pages_url(path: Path) -> str:
    relative = path.relative_to(REPO_ROOT).as_posix()
    return PAGES_BASE + quote(relative, safe="/")


def activity_files() -> list[Path]:
    files = [
        path
        for path in FINAL_DIR.glob("*/*.html")
        if path.name.lower() != "index.html"
    ]
    return sorted(files, key=lambda path: path.as_posix().lower())


def render_activity(path: Path) -> str:
    title = title_from_html(path)
    relative = path.relative_to(FINAL_DIR).as_posix()
    url = pages_url(path)
    return f"""      <li class="activity-card">
        <div>
          <h2>{html.escape(title)}</h2>
          <p>{html.escape(url)}</p>
        </div>
        <a class="open-link" href="{html.escape(relative)}">Open</a>
      </li>"""


def render_index(files: list[Path]) -> str:
    activities = "\n".join(render_activity(path) for path in files)
    today = date.today().strftime("%B %-d, %Y")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Money Basics Activity HTML Packages</title>
  <style>
    :root {{
      color-scheme: light;
      --ink: #17202a;
      --muted: #5b6673;
      --line: #d7dee8;
      --paper: #ffffff;
      --soft: #f6f8fb;
      --accent: #0b6b7c;
      --accent-strong: #084b57;
      --focus: #b54708;
    }}

    * {{
      box-sizing: border-box;
    }}

    body {{
      margin: 0;
      min-height: 100vh;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
      color: var(--ink);
      background: var(--soft);
    }}

    main {{
      width: min(1040px, calc(100% - 32px));
      margin: 0 auto;
      padding: 40px 0 56px;
    }}

    header {{
      margin-bottom: 24px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 20px;
    }}

    h1 {{
      margin: 0 0 8px;
      font-size: clamp(2rem, 4vw, 3.5rem);
      line-height: 1.05;
      letter-spacing: 0;
    }}

    .lede {{
      max-width: 760px;
      margin: 0;
      color: var(--muted);
      font-size: 1rem;
    }}

    .activity-list {{
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }}

    .activity-card {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--paper);
    }}

    .activity-card h2 {{
      margin: 0 0 6px;
      font-size: 1.05rem;
      line-height: 1.25;
      letter-spacing: 0;
    }}

    .activity-card p {{
      margin: 0;
      color: var(--muted);
      overflow-wrap: anywhere;
      font-size: 0.92rem;
    }}

    .open-link {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 14px;
      border: 1px solid var(--accent);
      border-radius: 6px;
      color: #ffffff;
      background: var(--accent);
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
    }}

    .open-link:hover {{
      background: var(--accent-strong);
      border-color: var(--accent-strong);
    }}

    .open-link:focus-visible {{
      outline: 3px solid var(--focus);
      outline-offset: 3px;
    }}

    footer {{
      margin-top: 24px;
      color: var(--muted);
      font-size: 0.9rem;
    }}

    @media (max-width: 700px) {{
      main {{
        width: min(100% - 24px, 1040px);
        padding-top: 28px;
      }}

      .activity-card {{
        grid-template-columns: 1fr;
      }}

      .open-link {{
        width: 100%;
      }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Activity HTML Packages</h1>
      <p class="lede">Final Money Basics activity packages hosted on GitHub Pages.</p>
    </header>

    <ul class="activity-list" aria-label="Final activity links">
{activities}
    </ul>

    <footer>Updated {html.escape(today)}.</footer>
  </main>
</body>
</html>
"""


def main() -> None:
    files = activity_files()
    if not files:
        raise SystemExit(f"No package HTML files found in {FINAL_DIR}")

    output = FINAL_DIR / "index.html"
    output.write_text(render_index(files), encoding="utf-8")
    print(f"Updated {output} with {len(files)} activity links.")


if __name__ == "__main__":
    main()
