#!/usr/bin/env python3
from __future__ import annotations

import html
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

ROOT = Path('/workspaces/money_basics/main/rebuild')
WORKSHOPS_DIR = ROOT / 'content' / 'workshops'
OUTPUT = ROOT / 'index.html'


def rel_href(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    return quote(rel, safe='/')


def render_workshop(workshop_dir: Path) -> str:
    manifest_path = workshop_dir / 'manifest.json'
    if not manifest_path.exists():
        return ''

    data = json.loads(manifest_path.read_text(encoding='utf-8'))
    files = data.get('files', [])

    by_category: dict[str, list[dict]] = defaultdict(list)
    for row in files:
        by_category[row.get('category', 'uncategorized')].append(row)

    category_counts = Counter(row.get('category', 'uncategorized') for row in files)
    count_text = ', '.join(
        f"{cat}: {category_counts[cat]}" for cat in sorted(category_counts)
    )

    sections = []
    for cat in sorted(by_category):
        rows = sorted(by_category[cat], key=lambda r: r.get('dest', ''))
        items = []
        for row in rows:
            dest = row.get('dest', '')
            target = Path('/workspaces/money_basics') / dest
            if not target.exists():
                continue
            label = dest.replace('main/rebuild/', '')
            extra = []
            if row.get('page_role'):
                extra.append(f"page_role={row['page_role']}")
            if row.get('resource_role'):
                extra.append(f"resource_role={row['resource_role']}")
            meta = f" <span class=\"meta\">({', '.join(extra)})</span>" if extra else ''
            items.append(
                f"<li><a href=\"{html.escape(rel_href(target))}\">{html.escape(label)}</a>{meta}</li>"
            )

        if not items:
            continue

        sections.append(
            f"""
            <details>
              <summary>{html.escape(cat)} ({len(items)})</summary>
              <ul>
                {''.join(items)}
              </ul>
            </details>
            """
        )

    if not sections:
        return ''

    wname = workshop_dir.name
    return f"""
    <section class=\"workshop\">
      <h2>{html.escape(wname)}</h2>
      <p class=\"meta\">{len(files)} files indexed. {html.escape(count_text)}</p>
      {''.join(sections)}
    </section>
    """


def main() -> int:
    workshop_sections = []
    for workshop_dir in sorted(WORKSHOPS_DIR.glob('workshop-*')):
        if workshop_dir.is_dir():
            section = render_workshop(workshop_dir)
            if section:
                workshop_sections.append(section)

    generated = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%SZ')

    html_doc = f"""<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>Rebuild Index</title>
    <style>
      body {{
        font-family: Arial, sans-serif;
        margin: 24px auto;
        max-width: 1100px;
        padding: 0 16px 32px;
        color: #1f2937;
      }}
      h1 {{ margin-bottom: 8px; }}
      .meta {{ color: #4b5563; font-size: 14px; }}
      .top {{
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 14px;
      }}
      .links a {{ margin-right: 14px; }}
      .workshop {{
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 14px;
        margin-top: 16px;
      }}
      details {{ margin: 10px 0; }}
      summary {{ cursor: pointer; font-weight: 600; }}
      ul {{ margin: 8px 0 0; padding-left: 20px; }}
      li {{ margin: 4px 0; word-break: break-word; }}
      a {{ color: #0b5bd3; text-decoration: none; }}
      a:hover {{ text-decoration: underline; }}
    </style>
  </head>
  <body>
    <h1>Rebuild Index</h1>
    <div class=\"top\">
      <p>This index visualizes current, link-resolved file pathways for the new rebuild.</p>
      <p class=\"meta\">Generated: {generated}</p>
      <p class=\"links\">
        <a href=\"content/workshops/index.json\">Workshops Index JSON</a>
        <a href=\"docs/workshop-file-migration-report.json\">Migration Report JSON</a>
        <a href=\"docs/review-needed-high-priority.csv\">High Priority Review CSV</a>
      </p>
    </div>
    {''.join(workshop_sections)}
  </body>
</html>
"""

    OUTPUT.write_text(html_doc, encoding='utf-8')
    print(f"wrote {OUTPUT}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
