#!/usr/bin/env python3
import csv
import json
import re
import shutil
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('/workspaces/money_basics')
REBUILD = ROOT / 'main' / 'rebuild'
WHOLE_LEGACY = REBUILD / 'content' / 'legacy' / 'whole'
WORKSHOPS_DIR = REBUILD / 'content' / 'workshops'
MATERIALS_DIR = REBUILD / 'src' / 'site' / 'materials'
REPORTS_DIR = REBUILD / 'docs'

EXT_ALLOWED = {'.pdf', '.docx', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.html', '.txt', '.csv', '.zip', '.json'}
WORKSHOP_BUCKETS = [
    'pages',
    'activities',
    'resources',
    'archives',
    'worksheets',
    'Facilitator_Guide',
    'Student_Guide',
    'legacy',
]


def module_to_workshop_slug(name: str) -> str | None:
    m = re.search(r'(\d+)', name)
    if not m:
        return None
    return f"workshop-{int(m.group(1)):02d}"


def classify_relpath(rel: Path) -> str:
    parts = [p.lower() for p in rel.parts[:-1]]
    fn = rel.name.lower()
    rel_lc = str(rel).lower()
    parts_lc_join = '/'.join(parts)

    if rel.suffix.lower() == '.zip':
        return 'archives'

    # Folder context takes precedence over file-title keywords.
    # Guide buckets are reserved for explicit guide contexts and SG/FG abbreviations.
    if 'facilitator_guide' in rel_lc or (
        any('facilitator' in p for p in parts) and any('guide' in p for p in parts)
    ):
        return 'Facilitator_Guide'
    if 'student_guide' in rel_lc or (
        any('student' in p for p in parts) and any('guide' in p for p in parts)
    ):
        return 'Student_Guide'
    if 'sg:fg' in rel_lc or 'fg:sg' in rel_lc or '/sg/' in f'/{parts_lc_join}/' or '/fg/' in f'/{parts_lc_join}/':
        if re.search(r'(^|[^a-z0-9])fg([^a-z0-9]|$)', fn):
            return 'Facilitator_Guide'
        if re.search(r'(^|[^a-z0-9])sg([^a-z0-9]|$)', fn):
            return 'Student_Guide'
    if re.search(r'(^|[^a-z0-9])fg([^a-z0-9]|$)', fn):
        return 'Facilitator_Guide'
    if re.search(r'(^|[^a-z0-9])sg([^a-z0-9]|$)', fn):
        return 'Student_Guide'

    if 'worksheet' in fn or any('worksheet' in p for p in parts):
        return 'worksheets'
    if 'activity' in fn or any('activity' in p for p in parts):
        return 'activities'
    if rel.suffix.lower() in {'.html'}:
        return 'pages'
    return 'resources'


def infer_manifest_roles(rel: Path) -> tuple[str | None, str | None]:
    rel_lc = str(rel).lower()
    fn = rel.name.lower()

    page_role = None
    if fn == 'core-resources.html':
        page_role = 'core_resources_page'
    elif fn == 'additional-resources.html':
        page_role = 'additional_resources_page'
    elif fn == 'handouts.html':
        page_role = 'handouts_page'
    elif fn == 'worksheets.html':
        page_role = 'worksheets_page'
    elif fn == 'index.html':
        page_role = 'index_page'
    elif fn.endswith('.html'):
        page_role = 'content_page'

    resource_role = None
    if rel.suffix.lower() == '.zip':
        resource_role = 'archive'
        return page_role, resource_role

    if 'core-resource' in rel_lc or 'core resources' in rel_lc or 'core_resources' in rel_lc:
        resource_role = 'core_resource'
    elif (
        'additional-resource' in rel_lc
        or 'additional resources' in rel_lc
        or 'additional_resources' in rel_lc
    ):
        resource_role = 'additional_resource'
    elif 'handout' in rel_lc or re.search(r'\bho\b', fn):
        resource_role = 'handout'
    elif 'worksheet' in rel_lc:
        resource_role = 'worksheet'
    elif 'resource' in rel_lc:
        resource_role = 'resource'

    return page_role, resource_role


def sanitize_component(name: str) -> str:
    # Cross-platform safe destination names.
    value = name.replace(':', ' -')
    value = re.sub(r'\s+', ' ', value).strip()
    value = value.rstrip('.')
    return value or '_'


def sanitize_relpath(rel: Path) -> Path:
    return Path(*[sanitize_component(p) for p in rel.parts])


def normalize_destination_rel(rel: Path, category: str) -> Path:
    parts = list(rel.parts)
    lower_parts = [p.lower() for p in parts]

    if category in {'Student_Guide', 'Facilitator_Guide'}:
        start = 0
        markers = {'sg:fg', 'fg:sg'}
        if category == 'Student_Guide':
            markers.update({'student_guide', 'student guide'})
        if category == 'Facilitator_Guide':
            markers.update({'facilitator_guide', 'facilitator guide'})

        for i, part in enumerate(lower_parts):
            if part in markers:
                start = i + 1
                break

        tail = parts[start:] if start < len(parts) else [rel.name]

        # Remove known wrapper folder names from old split attempts.
        while tail and tail[0].lower() in {
            'student_guide',
            'student guide',
            'facilitator_guide',
            'facilitator guide',
        }:
            tail = tail[1:]
        while tail and re.fullmatch(r'workshop[_\s-]?\d+', tail[0].lower()):
            tail = tail[1:]

        rel = Path(*tail) if tail else Path(rel.name)

    return sanitize_relpath(rel)


def should_copy(path: Path) -> bool:
    if path.name.startswith('~$'):
        return False
    if path.name in {'.DS_Store'}:
        return False
    if 'copy' in path.stem.lower():
        return False
    if path.suffix.lower() not in EXT_ALLOWED:
        return False
    return True


def safe_copy(src: Path, dst: Path) -> str:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        shutil.copy2(src, dst)
        return 'copied'
    if src.stat().st_size == dst.stat().st_size:
        return 'existing'

    stem = dst.stem
    suffix = dst.suffix
    i = 2
    while True:
        alt = dst.with_name(f"{stem}__dup{i}{suffix}")
        if not alt.exists():
            shutil.copy2(src, alt)
            return f'copied_as_{alt.name}'
        i += 1


def clear_generated_workshop_buckets():
    if not WORKSHOPS_DIR.exists():
        return
    for ws in [p for p in WORKSHOPS_DIR.iterdir() if p.is_dir()]:
        for bucket in WORKSHOP_BUCKETS + ['facilitator', 'student', 'handouts']:
            target = ws / bucket
            if target.exists():
                shutil.rmtree(target)


def copy_materials_pages(manifest_rows: list[dict]):
    if not MATERIALS_DIR.exists():
        return

    for ws in sorted([p for p in MATERIALS_DIR.iterdir() if p.is_dir() and p.name.lower().startswith('workshop_')]):
        slug = module_to_workshop_slug(ws.name)
        if not slug:
            continue
        target = WORKSHOPS_DIR / slug
        target.mkdir(parents=True, exist_ok=True)
        (target / 'pages').mkdir(exist_ok=True)
        (target / 'activities').mkdir(exist_ok=True)

        for f in ws.rglob('*'):
            if not f.is_file() or not should_copy(f):
                continue
            rel = f.relative_to(ws)
            category = 'activities' if 'activity' in rel.parts else 'pages'
            dest_rel = sanitize_relpath(rel)
            dest = target / category / dest_rel
            result = safe_copy(f, dest)
            page_role, resource_role = infer_manifest_roles(rel)
            manifest_rows.append({
                'source': str(f.relative_to(ROOT)),
                'dest': str(dest.relative_to(ROOT)),
                'workshop': slug,
                'category': category,
                'page_role': page_role,
                'resource_role': resource_role,
                'result': result,
                'source_type': 'materials'
            })


def main() -> int:
    manifest_rows: list[dict] = []
    clear_generated_workshop_buckets()

    for module_dir in sorted([p for p in WHOLE_LEGACY.iterdir() if p.is_dir()]):
        slug = module_to_workshop_slug(module_dir.name)
        if not slug:
            continue

        target_base = WORKSHOPS_DIR / slug
        for d in WORKSHOP_BUCKETS:
            (target_base / d).mkdir(parents=True, exist_ok=True)

        for f in module_dir.rglob('*'):
            if not f.is_file() or not should_copy(f):
                continue
            rel = f.relative_to(module_dir)
            category = classify_relpath(rel)
            dest_rel = normalize_destination_rel(rel, category)
            dest = target_base / category / dest_rel
            result = safe_copy(f, dest)
            page_role, resource_role = infer_manifest_roles(rel)
            manifest_rows.append({
                'source': str(f.relative_to(ROOT)),
                'dest': str(dest.relative_to(ROOT)),
                'workshop': slug,
                'category': category,
                'page_role': page_role,
                'resource_role': resource_role,
                'result': result,
                'source_type': 'whole_legacy'
            })

    copy_materials_pages(manifest_rows)

    generated_at = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    counts = Counter(r['category'] for r in manifest_rows)
    by_workshop = Counter(r['workshop'] for r in manifest_rows)
    resource_role_counts = Counter(r['resource_role'] for r in manifest_rows if r['resource_role'])
    page_role_counts = Counter(r['page_role'] for r in manifest_rows if r['page_role'])

    json_report = {
        'generatedAt': generated_at,
        'totalRows': len(manifest_rows),
        'categoryCounts': dict(sorted(counts.items())),
        'resourceRoleCounts': dict(sorted(resource_role_counts.items())),
        'pageRoleCounts': dict(sorted(page_role_counts.items())),
        'workshopCounts': dict(sorted(by_workshop.items())),
        'rows': manifest_rows
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    json_path = REPORTS_DIR / 'workshop-file-migration-report.json'
    csv_path = REPORTS_DIR / 'workshop-file-migration-report.csv'
    summary_path = REPORTS_DIR / 'workshop-file-migration-summary.txt'

    with json_path.open('w', encoding='utf-8') as f:
        json.dump(json_report, f, indent=2)

    # Emit per-workshop manifests for workshop-centric indexing.
    rows_by_workshop: dict[str, list[dict]] = {}
    for row in manifest_rows:
        rows_by_workshop.setdefault(row['workshop'], []).append(row)
    for workshop, rows in sorted(rows_by_workshop.items()):
        workshop_manifest = {
            'generatedAt': generated_at,
            'workshop': workshop,
            'count': len(rows),
            'files': rows,
        }
        workshop_manifest_path = WORKSHOPS_DIR / workshop / 'manifest.json'
        workshop_manifest_path.write_text(
            json.dumps(workshop_manifest, indent=2) + '\n',
            encoding='utf-8',
        )

    with csv_path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                'source',
                'dest',
                'workshop',
                'category',
                'page_role',
                'resource_role',
                'result',
                'source_type',
            ],
        )
        writer.writeheader()
        writer.writerows(manifest_rows)

    lines = [
        f'Generated: {generated_at}',
        f'Total mapped files: {len(manifest_rows)}',
        '',
        'By category:'
    ]
    for k, v in sorted(counts.items()):
        lines.append(f'- {k}: {v}')

    lines.append('')
    lines.append('By resource_role:')
    for k, v in sorted(resource_role_counts.items()):
        lines.append(f'- {k}: {v}')

    lines.append('')
    lines.append('By page_role:')
    for k, v in sorted(page_role_counts.items()):
        lines.append(f'- {k}: {v}')

    lines.append('')
    lines.append('By workshop:')
    for k, v in sorted(by_workshop.items()):
        lines.append(f'- {k}: {v}')

    lines.extend([
        '',
        f'JSON report: {json_path.relative_to(ROOT)}',
        f'CSV report: {csv_path.relative_to(ROOT)}'
    ])

    summary_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('\n'.join(lines))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
