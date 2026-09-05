#!/usr/bin/env python3
"""IBP document generators — consolidated.

One CLI, three casts from their molds:

  python3 "docs/IBP_Go-Live-Checklist/generate_ibp_docs.py" form
      intake-form/IBP-Intake-Form.md  ->  IBP-Intake-Form.html
      (the client intake form; md is the single source of truth)

  python3 "docs/IBP_Go-Live-Checklist/generate_ibp_docs.py" golive-xlsx
      IBP-Go-Live-Definition-v1-HandEdited.xlsx (hand-edited, sections A & C — never re-authored)
      + ibp_golive_config_inventory.json (section B)
      ->  IBP-Go-Live-Definition-v2.xlsx

  python3 "docs/IBP_Go-Live-Checklist/generate_ibp_docs.py" questionnaire-xlsx
      ->  IBP-Setup-Questionnaire.xlsx
      (legacy Excel intake channel — retained until the HTML form fully replaces it)

Consolidated 13-Jul-2026 from three retired scripts (generate_ibp_intake_form,
generate_ibp_golive_v2_xlsx, generate_ibp_excel — see git history).
Default command: form.
"""

import base64
import html
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation


# ═════════════════════════════════════════════════════════════════════════════
# 1. INTAKE FORM (md -> self-contained HTML)
# ═════════════════════════════════════════════════════════════════════════════

def cmd_form():
    HERE = Path(__file__).resolve().parent
    REPO = HERE.parents[1]
    MD_PATH = HERE / "intake-form" / "IBP-Intake-Form.md"

    # ---------------------------------------------------------------- parsing ---

    def parse_frontmatter(text):
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        if not m:
            sys.exit("ERROR: frontmatter block (--- ... ---) not found at top of md.")
        meta = {}
        for line in m.group(1).splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, _, value = line.partition(":")
            meta[key.strip()] = value.strip()
        return meta, text[m.end():]


    def strip_comments(text):
        return re.sub(r"<!--.*?-->", "", text, flags=re.S)


    def md_inline(s):
        """Escape, then apply **bold** — the only inline markup we support."""
        s = html.escape(s, quote=False)
        return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)


    SECTION_RE = re.compile(r"^# Section:\s*(.+?)\s*$")
    PART_RE = re.compile(r"^# Part:\s*(.+?)\s*$")
    ATTR_RE = re.compile(r"\{(\w+)=([^}]*)\}")
    GROUP_RE = re.compile(r"^### Group:\s*(.+?)\s*$")
    STAGE_RE = re.compile(r"^### Stage:\s*(.+?)\s*$")
    HELP_RE = re.compile(r"^> Help:\s*(.+?)\s*$")
    CHECK_RE = re.compile(r"^- \[ \]\s*(.+?)\s*$")

    EXPECTED_COLS = 8  # ID | Question | Type | Options | Owner | Required | Help | Internal


    def parse_document(body):
        welcome, prereq_intro, sections = [], [], []
        prereq_stages = []     # [{'title': str|None, 'items': [str]}]
        mode = None            # 'welcome' | 'prereq' | 'section'
        section = None         # current section dict
        group = None           # current group dict
        current_part = None    # current "# Part:" chapter title
        for raw in body.splitlines():
            line = raw.rstrip()
            if line.startswith("# Out of Scope"):
                break  # parking-lot appendix — never rendered into the form
            if line.startswith("# Welcome"):
                mode = "welcome"
                continue
            if line.startswith("# Pre-requisites"):
                mode = "prereq"
                continue
            m = PART_RE.match(line)
            if m:
                current_part = m.group(1)
                continue
            m = SECTION_RE.match(line)
            if m:
                raw = m.group(1)
                attrs = dict(ATTR_RE.findall(raw))
                section = {"title": ATTR_RE.sub("", raw).strip(),
                           "repeat": attrs.get("repeat"), "stage": attrs.get("stage"),
                           "part": current_part, "help": "", "groups": []}
                group = {"title": None, "help": "", "questions": []}
                section["groups"].append(group)
                sections.append(section)
                mode = "section"
                continue
            if mode == "welcome":
                welcome.append(line)
                continue
            if mode == "prereq":
                m = STAGE_RE.match(line)
                if m:
                    prereq_stages.append({"title": m.group(1), "items": []})
                    continue
                m = CHECK_RE.match(line)
                if m:
                    if not prereq_stages:
                        prereq_stages.append({"title": None, "items": []})
                    prereq_stages[-1]["items"].append(m.group(1))
                elif line.strip():
                    prereq_intro.append(line.strip())
                continue
            if mode != "section":
                continue
            m = GROUP_RE.match(line)
            if m:
                group = {"title": m.group(1), "help": "", "questions": []}
                section["groups"].append(group)
                continue
            m = HELP_RE.match(line)
            if m:
                # Attach to the group when one is open and still empty of
                # questions; otherwise it is the section-level help.
                if group["title"] and not group["questions"]:
                    group["help"] = m.group(1)
                elif not section["groups"][0]["questions"] and group is section["groups"][0]:
                    section["help"] = m.group(1)
                else:
                    group["help"] = m.group(1)
                continue
            if line.startswith("|"):
                cells = [c.strip() for c in line.strip("|").split("|")]
                if not cells or cells[0] in ("ID", "---", ""):
                    continue
                if all(set(c) <= {"-", " "} for c in cells):
                    continue
                if len(cells) < EXPECTED_COLS:
                    cells += [""] * (EXPECTED_COLS - len(cells))
                q = dict(zip(
                    ["id", "label", "type", "fmt", "owner", "required",
                     "help", "internal"], cells[:EXPECTED_COLS]))
                group["questions"].append(q)
        # drop empty leading groups (sections whose questions all live in named groups)
        for s in sections:
            s["groups"] = [g for g in s["groups"] if g["questions"] or g["title"]]
        return "\n".join(welcome).strip(), " ".join(prereq_intro), prereq_stages, sections


    TYPE_RE = re.compile(r"^(\w+)\s*(?:\((.*)\))?\s*$")


    def parse_type(spec):
        m = TYPE_RE.match(spec)
        if not m:
            return "text", []
        kind = m.group(1).lower()
        args = [a.strip() for a in (m.group(2) or "").split(",") if a.strip()]
        return kind, args


    def slugify(title):
        t = re.sub(r"^\d+\.\s*", "", title)
        return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


    # --------------------------------------------------------------- assets -----

    def logo_data_uri(meta):
        rel = meta.get("header_logo", "")
        path = REPO / rel
        if not path.exists():
            print(f"WARN: logo not found at {path}; using text fallback")
            return ""
        b64 = base64.b64encode(path.read_bytes()).decode()
        ext = path.suffix.lstrip(".").lower()
        mime = "image/svg+xml" if ext == "svg" else f"image/{ext}"
        return f"data:{mime};base64,{b64}"


    # -------------------------------------------------------------- rendering ---

    def render_welcome(welcome_md, title):
        blocks = [b.strip() for b in welcome_md.split("\n\n") if b.strip()]
        parts = []
        for b in blocks:
            lines = [l.strip() for l in b.splitlines() if l.strip()]
            if all(re.match(r"\d+\.\s", l) for l in lines):
                items = "".join(f"<li>{md_inline(re.sub(r'^\d+[.]\s*', '', l))}</li>"
                                for l in lines)
                parts.append(f"<ol>{items}</ol>")
            elif all(l.startswith("- ") for l in lines):
                items = "".join(f"<li>{md_inline(l[2:])}</li>" for l in lines)
                parts.append(f"<ul>{items}</ul>")
            else:
                parts.append(f"<p>{md_inline(b)}</p>")
        body = "".join(parts)
        return f'''
    <section class="card welcome" id="welcome">
      <p class="eyebrow">Welcome</p>
      <h2>{html.escape(title)}</h2>
      {body}
      <div class="hiw">
        <div class="hiw-step"><span class="hiw-num">1</span><div><strong>Fill the sections</strong>
          <p>Work top to bottom — your progress saves in this browser.</p></div></div>
        <div class="hiw-step"><span class="hiw-num">2</span><div><strong>Export</strong>
          <p>Download the JSON and Excel summary in the last section.</p></div></div>
        <div class="hiw-step"><span class="hiw-num">3</span><div><strong>Return to IIRM</strong>
          <p>Send the exported files and attachments to your IIRM manager.</p></div></div>
      </div>
    </section>'''


    def render_prereqs(intro, stages):
        total = sum(len(st["items"]) for st in stages)
        panels = []
        for idx, st in enumerate(stages, 1):
            lis = "".join(
                f'<li><label><input type="checkbox" class="prereq-check"> '
                f'<span>{md_inline(t)}</span></label></li>'
                for t in st["items"])
            raw = st["title"] or f"Stage {idx}"
            m = re.match(r"\s*(\d+)\s*[—-]+\s*(.*)", raw)
            num, caption = (m.group(1), m.group(2)) if m else (str(idx), raw)
            panels.append(
                f'<div class="stage" data-stage="{num}"><div class="stage-head">'
                f'<span class="stage-num">{num}</span>'
                f'<h3 class="stage-title">{md_inline(caption)}</h3>'
                f'<span class="stage-count">0 / {len(st["items"])}</span></div>'
                f'<ul class="prereq-list">{lis}</ul></div>')
        return f'''
    <section class="card" id="prerequisites">
      <div class="section-head">
        <p class="eyebrow">Before you start</p>
        <h2>Pre-requisites <span class="prereq-count" id="prereqCount">0 / {total} ready</span></h2>
        <p class="section-help">{md_inline(intro)}</p>
      </div>
      <div class="stage-pipeline">{''.join(panels)}</div>
    </section>'''


    def owner_badge(owner):
        if owner == "IIRM":
            return '<span class="badge badge-iirm">IIRM to fill</span>'
        if owner == "Client+IIRM":
            return '<span class="badge badge-mixed">Client + IIRM</span>'
        return ""


    def input_control(q, name):
        kind, args = parse_type(q["type"])
        fmt = q["fmt"] if q["fmt"] not in ("", "—", "-") else ""
        ph = html.escape(fmt, quote=True)
        al = html.escape(q["label"], quote=True)
        if kind in ("text", "email", "phone", "number", "date"):
            itype = {"phone": "tel"}.get(kind, kind)
            narrow = " narrow" if kind in ("number", "date") else ""
            return (f'<input class="control{narrow}" type="{itype}" '
                    f'name="{name}" placeholder="{ph}" aria-label="{al}">')
        if kind == "textarea":
            return f'<textarea class="control" rows="3" name="{name}" placeholder="{ph}" aria-label="{al}"></textarea>'
        if kind == "list":
            return (f'<textarea class="control" rows="4" name="{name}" '
                    f'placeholder="One item per line" aria-label="{al}"></textarea>')
        if kind == "yesno":
            return (f'<div class="segmented" role="radiogroup" aria-label="{al}">'
                    f'<label><input type="radio" name="{name}" value="Yes"><span>Yes</span></label>'
                    f'<label><input type="radio" name="{name}" value="No"><span>No</span></label>'
                    f'</div>')
        if kind == "select":
            opts = "".join(f'<option value="{html.escape(o, quote=True)}">{html.escape(o)}</option>'
                           for o in args)
            return (f'<select class="control narrow" name="{name}" aria-label="{al}">'
                    f'<option value="">— select —</option>{opts}</select>')
        if kind == "multiselect":
            boxes = "".join(
                f'<label class="checkline"><input type="checkbox" value="{html.escape(o, quote=True)}">'
                f'<span>{html.escape(o)}</span></label>' for o in args)
            return f'<div class="checkgroup" role="group" aria-label="{al}">{boxes}</div>'
        if kind == "contact":
            return ('<div class="contact-grid">'
                    f'<input class="control" type="text" data-part="name" placeholder="Name" name="{name}-name" aria-label="{al} — Name">'
                    f'<input class="control" type="tel" data-part="phone" placeholder="Phone" name="{name}-phone" aria-label="{al} — Phone">'
                    f'<input class="control" type="email" data-part="email" placeholder="Email" name="{name}-email" aria-label="{al} — Email">'
                    '</div>')
        if kind == "file":
            accept = html.escape("; ".join(args), quote=True)
            return (f'<div class="filewrap"><label class="filebtn">'
                    f'<input type="file" name="{name}" aria-label="{al}">Choose file</label>'
                    f'<span class="file-name" data-empty="No file chosen"></span>'
                    f'<span class="file-hint">{accept}</span></div>')
        if kind == "relmatrix":
            inner = re.search(r"relmatrix\((.*)\)\s*$", q["type"]).group(1)
            body_rows = []
            for grp in inner.split(";"):
                cat, _, opts = grp.partition(":")
                body_rows.append(f'<tr class="rel-cat"><td colspan="5">{html.escape(cat.strip())}</td></tr>')
                for r in [o.strip() for o in opts.split(",") if o.strip()]:
                    er = html.escape(r, quote=True)
                    body_rows.append(
                        f'<tr data-rel="{er}">'
                        f'<td class="rel-allow"><input type="checkbox" data-part="allowed" aria-label="Allow {er}"></td>'
                        f'<td class="rel-name">{html.escape(r)}</td>'
                        f'<td><input type="number" min="0" data-part="min" aria-label="{er} — minimum age" disabled></td>'
                        f'<td><input type="number" min="0" data-part="max" aria-label="{er} — maximum age" disabled></td>'
                        f'<td><input type="text" data-part="notes" placeholder="e.g. studying, unmarried" aria-label="{er} — notes" disabled></td>'
                        f'</tr>')
            return (f'<div class="rel-matrix"><div class="table-scroll"><table>'
                    f'<thead><tr><th>Allowed</th><th>Relationship</th><th>Min age</th>'
                    f'<th>Max age</th><th>Notes</th></tr></thead>'
                    f'<tbody>{"".join(body_rows)}</tbody></table></div></div>')
        if kind == "rows":
            cols_attr = html.escape(json.dumps(args), quote=True)
            head = "".join(f"<th>{html.escape(c)}</th>" for c in args)
            return (f'<div class="rows-field" data-cols="{cols_attr}">'
                    f'<div class="table-scroll"><table><thead><tr>{head}'
                    f'<th class="rowdel-col"></th></tr></thead><tbody></tbody></table></div>'
                    f'<button type="button" class="btn-dashed btn-addrow">+ Add row</button></div>')
        if kind == "info":
            return f'<p class="info-note">{md_inline(q["fmt"])}</p>'
        return f'<input class="control" type="text" name="{name}" placeholder="{ph}">'


    TPL_MIMES = {
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    def template_button(fname):
        path = MD_PATH.parent / "templates" / fname
        if not path.exists():
            print(f"WARN: template not found: {path}")
            return ""
        b64 = base64.b64encode(path.read_bytes()).decode()
        mime = TPL_MIMES.get(path.suffix.lower(), "application/octet-stream")
        label = html.escape(fname, quote=True)
        return (f'<a class="tpl-btn" download="{label}" '
                f'href="data:{mime};base64,{b64}">Download template: {label}</a>')

    def render_question(q, sec_slug):
        q = dict(q)
        tpl_html = ""
        m = re.search(r"template=(\S+)", q["fmt"])
        if m:
            tpl_html = template_button(m.group(1))
            q["fmt"] = re.sub(r"\s*;?\s*template=\S+", "", q["fmt"]).strip() or "—"
        kind, _ = parse_type(q["type"])
        name = f"{sec_slug}-{q['id']}-__IDX__"
        req = '<span class="req" title="Required">*</span>' if q["required"] == "Yes" else ""
        fmt_note = ""
        if q["fmt"] not in ("", "—", "-") and kind in ("yesno", "select", "multiselect",
                                                       "contact", "rows", "file"):
            fmt_note = f'<span class="fmt-note">{md_inline(q["fmt"])}</span>'
        internal = ""
        if q["internal"] not in ("", "—", "-"):
            internal = f'<p class="internal-note">IIRM: {md_inline(q["internal"])}</p>'
        owner_cls = " field-iirm" if q["owner"] == "IIRM" else ""
        return f'''
    <div class="field{owner_cls}" data-qid="{q['id']}" data-type="{kind}"
         data-owner="{html.escape(q['owner'], quote=True)}" data-required="{q['required']}"
         data-label="{html.escape(q['label'], quote=True)}">
      <div class="label-row"><span class="qid">{q['id']}</span>
        <span class="qlabel">{md_inline(q['label'])}</span>{req}{owner_badge(q['owner'])}{fmt_note}
      </div>
      <p class="help">{md_inline(q['help'])}</p>
      {input_control(q, name)}
      {tpl_html}
      {internal}
    </div>'''


    def render_group(g, sec_slug):
        qs = "".join(render_question(q, sec_slug) for q in g["questions"])
        if not g["title"]:
            return qs
        help_html = f'<p class="group-help">{md_inline(g["help"])}</p>' if g["help"] else ""
        return f'''
    <div class="group">
      <h3 class="group-title">{html.escape(g["title"])}</h3>
      {help_html}
      {qs}
    </div>'''


    def render_export_section(s, num):
        return f'''
    <section class="card" id="{slugify(s['title'])}" data-section-key="{slugify(s['title'])}">
      <div class="section-head">
        <p class="eyebrow">Section {num}</p>
        <h2>Review &amp; Export</h2>
        <p class="section-help">Check the summary of everything entered, then export.
        Files download to your computer; nothing is sent anywhere automatically.</p>
      </div>
      <p class="missing-note" id="missingNote"></p>
      <div class="export-actions">
        <button type="button" class="btn btn-primary" id="btnJson">Download JSON</button>
        <button type="button" class="btn btn-primary" id="btnCsv">Download Excel (CSV)</button>
        <button type="button" class="btn btn-ghost" disabled
                title="Available once the database specs are finalised">Submit to IIRM — coming soon</button>
        <button type="button" class="btn btn-danger-ghost" id="btnClear">Clear form</button>
      </div>
      <div class="summary-head">
        <h3 class="group-title">Summary of answers</h3>
        <button type="button" class="btn btn-ghost btn-sm" id="btnSummary">Refresh summary</button>
      </div>
      <div id="summary" class="summary"><p class="help">Press "Refresh summary" to see everything entered so far.</p></div>
    </section>'''


    def stage_chip(stage):
        return (f'<span class="stage-chip st-{stage}">Stage {stage}</span>'
                if stage else "")

    def section_head(num, title_clean, help_html, stage=None):
        return f'''
      <div class="section-head">
        <div class="section-head-row">
          <div>
            <p class="eyebrow">Section {num}{stage_chip(stage)}</p>
            <h2>{html.escape(title_clean)}</h2>
          </div>
          <span class="status-pill">Not started</span>
        </div>
        {help_html}
        <div class="sec-progress"><div class="sec-progress-fill"></div></div>
      </div>'''


    def render_section(s, num):
        slug = slugify(s["title"])
        if "review" in slug and "export" in slug:
            return render_export_section(s, num)
        help_html = f'<p class="section-help">{md_inline(s["help"])}</p>' if s["help"] else ""
        groups = "".join(render_group(g, slug) for g in s["groups"])
        title_clean = re.sub(r"^\d+\.\s*", "", s["title"])
        head = section_head(num, title_clean, help_html, s.get("stage"))
        if s["repeat"]:
            label = html.escape(s["repeat"], quote=True)
            return f'''
    <section class="card" id="{slug}" data-section-key="{slug}" data-repeat="{label}">
      {head}
      <template class="instance-tpl">
        <div class="instance">
          <div class="instance-head">
            <h3 class="instance-title">{label} <span class="inst-num"></span></h3>
            <button type="button" class="btn-remove">Remove</button>
          </div>
          {groups}
        </div>
      </template>
      <div class="instances"></div>
      <button type="button" class="btn-dashed btn-add-instance">+ Add another {label}</button>
    </section>'''
        return f'''
    <section class="card" id="{slug}" data-section-key="{slug}">
      {head}
      {groups}
    </section>'''


    def render_footer(meta):
        name = html.escape(meta.get("footer_company_name", ""))
        segs = [s.strip() for s in meta.get("footer_license", "").split("•") if s.strip()]
        if len(segs) > 1:
            lines = [f"{segs[0]} . {segs[1]}"] + segs[2:]
        else:
            lines = segs
        lic = "".join(f'<p class="foot-line">{html.escape(l)}</p>' for l in lines)
        copyright_ = html.escape(meta.get("footer_copyright", ""))
        links = "".join(
            f'<a href="{html.escape(meta.get(k, "#"), quote=True)}" target="_blank" rel="noopener noreferrer">{t}</a>'
            for k, t in [("footer_link_terms", "Terms &amp; Conditions"),
                         ("footer_link_privacy", "Privacy Policy"),
                         ("footer_link_grievance", "Report Grievance")])
        return f'''
    <footer class="site-footer">
      <div class="foot-inner">
        <div class="foot-logo"><img src="__LOGO__" alt="IIRM logo"></div>
        <div class="foot-divider"></div>
        <div class="foot-text">
          <p class="foot-name">{name}</p>
          {lic}
          <p class="foot-copy">{copyright_} This form is part of the Integrated Wellness Hub (IWH) onboarding.</p>
        </div>
        <nav class="foot-links">{links}</nav>
      </div>
    </footer>'''


    # ------------------------------------------------------------------- css ----

    CSS = r'''
    :root{
      --ground:#F5F2EC; --paper:#FFFFFF; --ink:#1E232B; --ink2:#5C6370;
      --line:#E3DDD2; --line2:#EEE9E0;
      --accent:#0B4A8F; --accent2:#215DAA; --accent-ink:#FFFFFF;
      --warm:#C1582B; --warm-soft:#FBEEE3;
      --ok:#2E8B57; --ok-bg:#E4F3EA; --acc-bg:#E4EDF8; --prog:#9A6100; --prog-bg:#FCF1DA;
      --none:#6E7683; --none-bg:#EEECE7;
      --req:#C43D3D;
      --iirm:#8A5A00; --iirm-bg:#FFF3D6; --iirm-line:#EAD9AC;
      --chip:#EFE9DF; --focus:#2E7CD6;
      --head-bg:#0E3A6E; --head-bg2:#155091; --head-ink:#FFFFFF; --head-ink2:#B9CDE6;
      --card-shadow:0 1px 2px rgba(30,35,43,.05), 0 4px 14px rgba(30,35,43,.04);
      --foot-bg:#EFEAE2;
    }
    @media (prefers-color-scheme: dark){
      :root{
        --ground:#11151C; --paper:#1A202A; --ink:#E7E9ED; --ink2:#9AA3B2;
        --line:#2A313D; --line2:#232A35;
        --accent:#7FB0EA; --accent2:#9CC4F0; --accent-ink:#0E1723;
        --warm:#E08A57; --warm-soft:#2A2019;
        --ok:#5FBF7F; --ok-bg:#17281D; --acc-bg:#1C2A3C; --prog:#E3B341; --prog-bg:#2A2416;
        --none:#78818F; --none-bg:#20262F;
        --req:#E07B7B;
        --iirm:#E3B341; --iirm-bg:#2A2416; --iirm-line:#4A3F1E;
        --chip:#242B37; --focus:#7FB0EA;
        --head-bg:#141C28; --head-bg2:#1B2635; --head-ink:#E7E9ED; --head-ink2:#8FA3BD;
        --card-shadow:none;
        --foot-bg:#10141A;
      }
    }
    :root[data-theme="light"]{
      --ground:#F5F2EC; --paper:#FFFFFF; --ink:#1E232B; --ink2:#5C6370;
      --line:#E3DDD2; --line2:#EEE9E0;
      --accent:#0B4A8F; --accent2:#215DAA; --accent-ink:#FFFFFF;
      --warm:#C1582B; --warm-soft:#FBEEE3;
      --ok:#2E8B57; --ok-bg:#E4F3EA; --acc-bg:#E4EDF8; --prog:#9A6100; --prog-bg:#FCF1DA;
      --none:#6E7683; --none-bg:#EEECE7;
      --req:#C43D3D;
      --iirm:#8A5A00; --iirm-bg:#FFF3D6; --iirm-line:#EAD9AC;
      --chip:#EFE9DF; --focus:#2E7CD6;
      --head-bg:#0E3A6E; --head-bg2:#155091; --head-ink:#FFFFFF; --head-ink2:#B9CDE6;
      --card-shadow:0 1px 2px rgba(30,35,43,.05), 0 4px 14px rgba(30,35,43,.04);
      --foot-bg:#EFEAE2;
    }
    :root[data-theme="dark"]{
      --ground:#11151C; --paper:#1A202A; --ink:#E7E9ED; --ink2:#9AA3B2;
      --line:#2A313D; --line2:#232A35;
      --accent:#7FB0EA; --accent2:#9CC4F0; --accent-ink:#0E1723;
      --warm:#E08A57; --warm-soft:#2A2019;
      --ok:#5FBF7F; --ok-bg:#17281D; --acc-bg:#1C2A3C; --prog:#E3B341; --prog-bg:#2A2416;
      --none:#78818F; --none-bg:#20262F;
      --req:#E07B7B;
      --iirm:#E3B341; --iirm-bg:#2A2416; --iirm-line:#4A3F1E;
      --chip:#242B37; --focus:#7FB0EA;
      --head-bg:#141C28; --head-bg2:#1B2635; --head-ink:#E7E9ED; --head-ink2:#8FA3BD;
      --card-shadow:none;
      --foot-bg:#10141A;
    }
    *{box-sizing:border-box}
    body{
      margin:0; background:var(--ground); color:var(--ink);
      font-family:"Poppins","Avenir Next","Segoe UI",system-ui,-apple-system,sans-serif;
      font-size:14.5px; line-height:1.55;
    }
    h1,h2,h3{text-wrap:balance; margin:0}
    a{color:var(--accent)}
    button{font:inherit}
    input,select,textarea{font:inherit; color:var(--ink)}
    :focus-visible{outline:2px solid var(--focus); outline-offset:2px}

    /* header */
    .site-header{
      position:sticky; top:0; z-index:20;
      background:linear-gradient(135deg, var(--head-bg), var(--head-bg2));
      color:var(--head-ink);
    }
    .head-inner{
      max-width:980px; margin:0 auto; padding:12px 20px;
      display:flex; align-items:center; gap:14px;
    }
    .logo-chip{
      background:#fff; border-radius:8px;
      padding:5px 9px; display:flex; align-items:center; flex:none;
      box-shadow:0 1px 3px rgba(0,0,0,.25);
    }
    .logo-chip img{height:32px; display:block}
    .head-titles{min-width:0; flex:1}
    .head-titles h1{font-size:16px; font-weight:600; line-height:1.25; color:var(--head-ink)}
    .head-titles p{margin:0; font-size:12px; color:var(--head-ink2);
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
    .head-right{display:flex; align-items:center; gap:12px; flex:none}
    .version-chip{
      font-size:11px; letter-spacing:.04em; background:rgba(255,255,255,.14);
      border-radius:999px; padding:3px 10px; color:var(--head-ink2); white-space:nowrap;
    }
    .toggle{display:flex; align-items:center; gap:6px; font-size:12px;
      color:var(--head-ink2); cursor:pointer; white-space:nowrap; user-select:none}
    .toggle input{accent-color:var(--warm)}
    .progress-rail{height:5px; background:rgba(255,255,255,.16)}
    .progress-fill{height:100%; width:0%;
      background:linear-gradient(90deg, var(--warm), #E9A13B); transition:width .25s}
    @media (prefers-reduced-motion: reduce){ .progress-fill{transition:none} }
    .progress-label{
      max-width:980px; margin:0 auto; padding:4px 20px 8px; font-size:11.5px;
      color:var(--head-ink2); text-align:right;
    }

    /* toc / section stepper */
    .toc{max-width:980px; margin:16px auto 0; padding:0 20px;
      display:flex; flex-wrap:wrap; gap:8px}
    .toc a{
      display:inline-flex; align-items:center; gap:7px;
      font-size:12px; font-weight:500; text-decoration:none; color:var(--ink2);
      background:var(--paper); border:1px solid var(--line);
      border-radius:999px; padding:5px 13px; box-shadow:var(--card-shadow);
    }
    .toc a:hover{border-color:var(--accent); color:var(--accent)}
    .toc .dot{width:8px; height:8px; border-radius:50%; background:var(--none); flex:none}
    .toc a.state-progress .dot{background:var(--prog)}
    .toc a.state-done .dot{background:var(--ok)}
    .toc a.state-done{border-color:var(--ok); color:var(--ok)}

    /* section status */
    .status-pill{
      font-size:11px; font-weight:600; letter-spacing:.03em; white-space:nowrap;
      border-radius:999px; padding:4px 12px; flex:none;
      background:var(--none-bg); color:var(--none);
    }
    .status-pill.state-progress{background:var(--prog-bg); color:var(--prog)}
    .status-pill.state-done{background:var(--ok-bg); color:var(--ok)}
    .sec-progress{height:4px; border-radius:2px; background:var(--line2);
      margin-top:14px; overflow:hidden}
    .sec-progress-fill{height:100%; width:0%; background:var(--ok); transition:width .25s}
    .sec-progress-fill[data-state="progress"]{background:var(--prog)}
    @media (prefers-reduced-motion: reduce){ .sec-progress-fill{transition:none} }

    /* layout + cards */
    main{max-width:980px; margin:0 auto; padding:16px 20px 48px;
      display:flex; flex-direction:column; gap:18px}
    .card{
      background:var(--paper); border:1px solid var(--line);
      border-radius:12px; padding:24px 28px; box-shadow:var(--card-shadow);
    }
    .eyebrow{
      margin:0 0 2px; font-size:11px; font-weight:600; letter-spacing:.09em;
      text-transform:uppercase; color:var(--warm);
    }
    .card h2{font-size:19px; font-weight:600}
    .section-help,.group-help{margin:6px 0 0; font-size:13px; color:var(--ink2); max-width:68ch}
    .section-head{margin-bottom:18px}
    .section-head-row{display:flex; align-items:flex-start; justify-content:space-between; gap:16px}
    .welcome p{max-width:70ch}
    .welcome h2{margin-bottom:6px}

    /* prereqs */
    .prereq-count{font-size:12px; font-weight:500; color:var(--ink2);
      background:var(--chip); border-radius:999px; padding:2px 10px;
      margin-left:8px; vertical-align:2px}
    .stage{margin-top:14px}
    .stage-title{font-size:12px; font-weight:600; letter-spacing:.06em;
      text-transform:uppercase; color:var(--warm); margin:0 0 6px}
    .prereq-list{list-style:none; margin:0; padding:0;
      display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:6px 24px}
    .prereq-list label{display:flex; gap:9px; align-items:flex-start;
      font-size:13.5px; cursor:pointer; padding:3px 0}
    .prereq-list input{margin-top:3px; accent-color:var(--ok); flex:none}

    /* groups + fields */
    .group{border-top:1px solid var(--line2); margin-top:20px; padding-top:16px}
    .group-title{font-size:13px; font-weight:600; letter-spacing:.05em;
      text-transform:uppercase; color:var(--ink2)}
    .field{margin-top:16px}
    .label-row{display:flex; align-items:baseline; gap:8px; flex-wrap:wrap}
    .qid{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10.5px;
      color:var(--ink2); background:var(--chip); border-radius:4px; padding:1px 6px; flex:none}
    .qlabel{font-weight:600; font-size:14px}
    .req{color:var(--req); font-weight:700}
    .fmt-note{font-size:12px; color:var(--ink2)}
    .badge{font-size:10.5px; font-weight:600; letter-spacing:.03em;
      border-radius:999px; padding:2px 9px; white-space:nowrap}
    .badge-iirm{background:var(--iirm-bg); color:var(--iirm); border:1px solid var(--iirm-line)}
    .badge-mixed{background:none; color:var(--ink2); border:1px solid var(--line)}
    .help{margin:3px 0 8px; font-size:12.5px; color:var(--ink2); max-width:68ch}
    .field-iirm .control,.field-iirm .segmented,.field-iirm .contact-grid{opacity:.65}
    .internal-note{
      display:none; margin:8px 0 0; font-size:12px; color:var(--iirm);
      background:var(--iirm-bg); border:1px solid var(--iirm-line);
      border-radius:6px; padding:6px 10px; max-width:68ch;
    }
    body.show-internal .internal-note{display:block}

    .control{
      width:100%; max-width:560px; background:var(--paper); color:var(--ink);
      border:1px solid var(--line); border-radius:8px; padding:9px 12px;
    }
    .control.narrow{max-width:280px}
    textarea.control{max-width:640px; resize:vertical}
    .control::placeholder{color:var(--ink2); opacity:.75}
    .control:focus{border-color:var(--accent)}

    .segmented{display:inline-flex; border:1px solid var(--line); border-radius:8px; overflow:hidden}
    .segmented label{cursor:pointer}
    .segmented input{position:absolute; opacity:0; pointer-events:none}
    .segmented span{display:inline-block; padding:7px 22px; font-size:13.5px; color:var(--ink2)}
    .segmented label + label span{border-left:1px solid var(--line)}
    .segmented input:checked + span{background:var(--accent); color:var(--accent-ink); font-weight:600}
    .segmented input:focus-visible + span{outline:2px solid var(--focus); outline-offset:-2px}

    .checkgroup{display:flex; flex-direction:column; gap:5px}
    .checkline{display:flex; gap:9px; align-items:center; font-size:13.5px; cursor:pointer}
    .checkline input{accent-color:var(--accent)}

    .contact-grid{display:grid; grid-template-columns:1.2fr .9fr 1.2fr; gap:8px; max-width:640px}
    @media (max-width:640px){ .contact-grid{grid-template-columns:1fr} }

    .filewrap{display:flex; align-items:center; gap:10px; flex-wrap:wrap}
    .filebtn{
      position:relative; overflow:hidden; display:inline-block; cursor:pointer;
      border:1px solid var(--accent); color:var(--accent); border-radius:8px;
      padding:7px 16px; font-size:13px; font-weight:500;
    }
    .filebtn input{position:absolute; inset:0; opacity:0; cursor:pointer}
    .file-name{font-size:13px}
    .file-name:empty::before{content:attr(data-empty); color:var(--ink2)}
    .file-hint{font-size:11.5px; color:var(--ink2)}

    .rows-field .table-scroll{overflow-x:auto; border:1px solid var(--line); border-radius:8px}
    .rows-field table{border-collapse:collapse; width:100%; min-width:560px}
    .rows-field th{
      text-align:left; font-size:11.5px; letter-spacing:.04em; text-transform:uppercase;
      color:var(--ink2); background:var(--chip); padding:8px 10px;
    }
    .rows-field td{border-top:1px solid var(--line2); padding:4px 6px}
    .rows-field td input{width:100%; min-width:120px; border:none; background:none;
      padding:6px; color:var(--ink); border-radius:4px}
    .rows-field td input:focus{outline:2px solid var(--focus); outline-offset:-1px}
    .rowdel-col{width:36px}
    .btn-rowdel{border:none; background:none; color:var(--req); cursor:pointer;
      font-size:15px; line-height:1; padding:4px 8px; border-radius:4px}
    .info-note{font-size:13px; color:var(--ink2); background:var(--chip);
      border-radius:6px; padding:8px 12px; max-width:68ch}
    .tpl-btn{display:inline-block; margin-top:8px; font-size:12.5px; font-weight:600;
      color:var(--accent); border:1px solid var(--accent); border-radius:8px;
      padding:7px 14px; text-decoration:none}
    .tpl-btn:hover{background:var(--accent); color:var(--accent-ink)}
    .welcome ol,.welcome ul{margin:6px 0 10px; padding-left:26px; max-width:70ch}
    .welcome li{margin:2px 0}

    .rel-matrix .table-scroll{overflow-x:auto; border:1px solid var(--line); border-radius:8px}
    .rel-matrix table{border-collapse:collapse; width:100%; min-width:600px}
    .rel-matrix th{text-align:left; font-size:11.5px; letter-spacing:.04em; text-transform:uppercase;
      color:var(--ink2); background:var(--chip); padding:8px 10px}
    .rel-matrix td{border-top:1px solid var(--line2); padding:5px 8px}
    .rel-matrix td input{border:1px solid var(--line); border-radius:6px; padding:5px 8px;
      background:var(--paper); color:var(--ink)}
    .rel-matrix td input[type=number]{width:90px}
    .rel-matrix td input[type=text]{width:100%; min-width:150px}
    .rel-matrix td input:disabled{opacity:.4}
    .rel-matrix .rel-name{font-weight:500; white-space:nowrap}
    .rel-cat td{background:var(--chip); font-size:10.5px; font-weight:700; letter-spacing:.06em;
      text-transform:uppercase; color:var(--ink2); padding:6px 10px}
    .rel-allow{text-align:center; width:64px}
    .rel-allow input{accent-color:var(--ok)}

    /* repeatable instances */
    .instance{border:1px solid var(--line); border-radius:10px;
      padding:4px 20px 20px; margin-top:14px; background:var(--paper)}
    .instance-head{display:flex; align-items:center; justify-content:space-between;
      border-bottom:1px solid var(--line2); padding:12px 0 10px; margin-bottom:2px}
    .instance-title{font-size:14.5px; font-weight:600; color:var(--warm)}
    .btn-remove{border:none; background:none; color:var(--req); cursor:pointer;
      font-size:12.5px; padding:4px 8px; border-radius:6px}
    .btn-remove:hover{background:var(--warm-soft)}
    .btn-dashed{
      margin-top:14px; width:100%; max-width:640px; cursor:pointer;
      border:1.5px dashed var(--line); background:none; color:var(--accent);
      border-radius:8px; padding:10px; font-size:13.5px; font-weight:500;
    }
    .btn-dashed:hover{border-color:var(--accent)}
    .btn-addrow{margin-top:8px; max-width:200px; padding:6px}

    /* buttons + export */
    .btn{border-radius:8px; padding:10px 20px; font-size:13.5px; font-weight:600;
      cursor:pointer; border:1px solid transparent}
    .btn-primary{background:var(--accent); color:var(--accent-ink)}
    .btn-primary:hover{background:var(--accent2)}
    .btn-ghost{background:none; border-color:var(--line); color:var(--ink2)}
    .btn-ghost:disabled{cursor:not-allowed; opacity:.6}
    .btn-danger-ghost{background:none; border-color:var(--line); color:var(--req)}
    .btn-sm{padding:6px 14px; font-size:12.5px}
    .export-actions{display:flex; gap:10px; flex-wrap:wrap; margin:8px 0 22px}
    .missing-note{font-size:13px; color:var(--req); margin:0 0 10px}
    .missing-note:empty{display:none}
    .summary-head{display:flex; align-items:center; justify-content:space-between;
      border-top:1px solid var(--line2); padding-top:16px}
    .summary{margin-top:12px}
    .summary h4{margin:16px 0 4px; font-size:13.5px; color:var(--warm)}
    .summary h5{margin:10px 0 2px; font-size:12.5px; color:var(--ink2)}
    .summary dl{margin:0; display:grid; grid-template-columns:minmax(200px,320px) 1fr;
      gap:2px 16px; font-size:13px}
    .summary dt{color:var(--ink2)}
    .summary dd{margin:0; overflow-wrap:anywhere}

    /* toast */
    .toast{
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:var(--ink); color:var(--ground); font-size:13px;
      border-radius:8px; padding:10px 18px; opacity:0; pointer-events:none;
      transition:opacity .25s; z-index:50; max-width:90vw;
    }
    .toast.show{opacity:1}
    @media (prefers-reduced-motion: reduce){ .toast{transition:none} }

    /* footer */
    .site-footer{background:var(--foot-bg); border-top:1px solid var(--line); margin-top:8px}
    .foot-inner{max-width:980px; margin:0 auto; padding:26px 20px;
      display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap}
    .foot-logo{background:#fff; border:1px solid var(--line); border-radius:8px; padding:6px 10px}
    .foot-logo img{height:36px; display:block}
    .foot-divider{width:1px; align-self:stretch; background:var(--line)}
    .foot-text{flex:1; min-width:260px}
    .foot-name{margin:0 0 4px; font-size:13.5px; font-weight:600}
    .foot-line{margin:0; font-size:12px; color:var(--ink2)}
    .foot-copy{margin:6px 0 0; font-size:12px; color:var(--ink2)}
    .foot-links{display:flex; flex-direction:column; gap:6px; font-size:12.5px}
    @media (max-width:720px){
      .card{padding:18px}
      .head-titles p{display:none}
      .foot-divider{display:none}
    }

    /* enhancements: policy chips, how-it-works, stage pipeline, sidebar stepper */
    .welcome ol{list-style:none; display:grid; padding:0; max-width:none;
      grid-template-columns:repeat(auto-fit, minmax(215px, 1fr)); gap:8px; margin:10px 0 4px}
    .welcome ol li{background:var(--warm-soft); color:var(--warm); font-size:13px;
      font-weight:500; border-radius:999px; padding:7px 14px}
    .hiw{display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:18px}
    .hiw-step{display:flex; gap:10px; background:var(--ground); border-radius:10px; padding:12px 14px}
    .hiw-num{flex:none; width:24px; height:24px; border-radius:50%; background:var(--accent);
      color:var(--accent-ink); font-size:12.5px; font-weight:600; display:flex;
      align-items:center; justify-content:center; margin-top:1px}
    .hiw-step strong{font-size:13.5px}
    .hiw-step p{margin:2px 0 0; font-size:12px; color:var(--ink2)}
    @media (max-width:720px){ .hiw{grid-template-columns:1fr} }

    .stage-pipeline{display:grid; grid-template-columns:repeat(3,1fr); gap:14px}
    .stage{border:1px solid var(--line); border-radius:10px; padding:14px 16px; margin:0}
    .stage-head{display:flex; align-items:flex-start; gap:9px; margin-bottom:8px}
    .stage-num{flex:none; width:24px; height:24px; border-radius:50%; background:var(--warm);
      color:#fff; font-size:12.5px; font-weight:600; display:flex;
      align-items:center; justify-content:center}
    .stage-title{font-size:12px; line-height:1.4; flex:1; margin:3px 0 0}
    .stage-count{font-size:11px; font-weight:600; background:var(--none-bg); color:var(--none);
      border-radius:999px; padding:2px 9px; white-space:nowrap; margin-top:3px}
    .stage-done .stage-count{background:var(--ok-bg); color:var(--ok)}
    .stage-done .stage-num{background:var(--ok); color:var(--accent-ink)}
    .stage .prereq-list{grid-template-columns:1fr}
    @media (max-width:900px){ .stage-pipeline{grid-template-columns:1fr} }

    .stage-chip{display:inline-block; font-size:10px; font-weight:600; letter-spacing:.05em;
      text-transform:uppercase; border-radius:999px; padding:2px 9px; margin-left:8px;
      vertical-align:1px}
    .st-1{background:var(--prog-bg); color:var(--prog)}
    .st-2{background:var(--acc-bg); color:var(--accent)}
    .st-3{background:var(--ok-bg); color:var(--ok)}
    .toc-s{font-size:9.5px; font-weight:700; border-radius:5px; padding:1px 5px; margin-left:2px}
    .url-preview{margin:7px 0 0; font-size:12.5px; font-weight:500; color:var(--ok)}
    .url-preview.empty{color:var(--ink2); font-weight:400}
    .url-preview strong{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-weight:600}
    .stage[data-stage="1"] .stage-num{background:var(--prog); color:var(--accent-ink)}
    .stage[data-stage="2"] .stage-num{background:var(--accent); color:var(--accent-ink)}
    .stage[data-stage="3"] .stage-num{background:var(--ok); color:var(--accent-ink)}
    .part-band{margin:22px 0 0; padding:12px 4px 10px; border-bottom:2px solid var(--warm)}
    .part-eyebrow{font-size:10.5px; font-weight:700; letter-spacing:.12em;
      text-transform:uppercase; color:var(--warm); display:block}
    .part-band h2{font-size:16.5px; font-weight:600; margin-top:2px}
    .toc-part{font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
      color:var(--ink2); margin-top:8px; padding:0 2px; width:100%}
    .toc a.active{border-color:var(--accent); color:var(--accent)}
    @media (min-width:1200px){
      .page{display:grid; grid-template-columns:250px minmax(0,1fr);
        max-width:1300px; margin:0 auto; gap:0 24px; padding:0 20px; align-items:start}
      .toc{position:sticky; top:104px; margin:16px 0 0; padding:0;
        display:flex; flex-direction:column; gap:5px;
        max-height:calc(100vh - 128px); overflow-y:auto}
      .toc a{border-radius:8px; padding:7px 12px}
      .toc a .toc-s{margin-left:auto}
      .toc a.active{font-weight:600; box-shadow:inset 3px 0 0 var(--warm)}
      main{margin:0; padding:16px 0 48px; max-width:none}
    }
    '''

    # -------------------------------------------------------------------- js ----

    JS = r'''
    (function(){
    "use strict";
    var KEY = "ibp-intake-draft-v1";
    var $ = function(s, el){ return (el||document).querySelector(s); };
    var $$ = function(s, el){ return Array.prototype.slice.call((el||document).querySelectorAll(s)); };

    /* ---------- repeatable instances ---------- */
    function renumber(section){
      $$(".instance", section).forEach(function(inst, i){
        $(".inst-num", inst).textContent = i + 1;
        $$("[name]", inst).forEach(function(el){
          el.setAttribute("name", el.getAttribute("name").replace(/__IDX__|-\d+$/g, "") + "-" + i);
        });
      });
    }
    function addInstance(section){
      var tpl = $(".instance-tpl", section);
      var node = tpl.content.firstElementChild.cloneNode(true);
      $(".instances", section).appendChild(node);
      renumber(section);
      return node;
    }
    function initRepeats(){
      $$("section[data-repeat]").forEach(function(sec){
        $(".btn-add-instance", sec).addEventListener("click", function(){
          addInstance(sec); save(); updateProgress();
        });
        sec.addEventListener("click", function(e){
          if (e.target.classList.contains("btn-remove")){
            var insts = $$(".instance", sec);
            if (insts.length <= 1){ toast("At least one " + sec.dataset.repeat + " is needed."); return; }
            e.target.closest(".instance").remove();
            renumber(sec); save(); updateProgress();
          }
        });
      });
    }
    /* fix names in non-repeat sections (strip __IDX__ placeholder) */
    function fixStaticNames(){
      $$("section[data-section-key]:not([data-repeat]) [name]").forEach(function(el){
        el.setAttribute("name", el.getAttribute("name").replace("__IDX__", "0"));
      });
    }

    /* ---------- dynamic rows ---------- */
    function addRow(rf){
      var cols = JSON.parse(rf.dataset.cols);
      var tr = document.createElement("tr");
      tr.innerHTML = cols.map(function(c){
        var esc = c.replace(/"/g, "&quot;");
        return '<td><input type="text" data-col="' + esc + '" aria-label="' + esc + '"></td>';
      }).join("") + '<td><button type="button" class="btn-rowdel" title="Remove row">&times;</button></td>';
      $("tbody", rf).appendChild(tr);
      return tr;
    }
    function initRows(){
      document.addEventListener("click", function(e){
        if (e.target.classList.contains("btn-addrow")){
          addRow(e.target.closest(".rows-field")); save(); updateProgress();
        }
        if (e.target.classList.contains("btn-rowdel")){
          e.target.closest("tr").remove(); save(); updateProgress();
        }
      });
    }

    /* ---------- file inputs ---------- */
    function initFiles(){
      document.addEventListener("change", function(e){
        if (e.target.type === "file"){
          var f = e.target.files[0];
          $(".file-name", e.target.closest(".filewrap")).textContent = f ? f.name : "";
        }
        if (e.target.dataset && e.target.dataset.part === "allowed"){
          var tr = e.target.closest("tr[data-rel]");
          if (tr) $$("input", tr).forEach(function(i){
            if (i.dataset.part !== "allowed") i.disabled = !e.target.checked;
          });
        }
      });
    }

    /* ---------- value get/set ---------- */
    function fieldValue(f){
      var t = f.dataset.type;
      if (t === "yesno"){ var r = $("input:checked", f); return r ? r.value : ""; }
      if (t === "select"){ var s = $("select", f); return s ? s.value : ""; }
      if (t === "multiselect"){ return $$("input:checked", f).map(function(c){ return c.value; }); }
      if (t === "contact"){
        var o = {};
        $$("[data-part]", f).forEach(function(i){ o[i.dataset.part] = i.value.trim(); });
        return o;
      }
      if (t === "relmatrix"){
        return $$("tr[data-rel]", f).filter(function(tr){
          return $('[data-part="allowed"]', tr).checked;
        }).map(function(tr){
          return { relationship: tr.dataset.rel,
                   min: $('[data-part="min"]', tr).value.trim(),
                   max: $('[data-part="max"]', tr).value.trim(),
                   notes: $('[data-part="notes"]', tr).value.trim() };
        });
      }
      if (t === "rows"){
        return $$("tbody tr", f).map(function(tr){
          var o = {};
          $$("[data-col]", tr).forEach(function(i){ o[i.dataset.col] = i.value.trim(); });
          return o;
        }).filter(function(r){ return Object.keys(r).some(function(k){ return r[k]; }); });
      }
      if (t === "list"){
        var ta = $("textarea", f);
        return ta.value.split("\n").map(function(s){ return s.trim(); }).filter(Boolean);
      }
      if (t === "file"){ return $(".file-name", f).textContent || ""; }
      var i = $("input,textarea", f); return i ? i.value.trim() : "";
    }
    function setFieldValue(f, v){
      var t = f.dataset.type;
      if (v == null) return;
      if (t === "yesno"){
        $$("input[type=radio]", f).forEach(function(r){ r.checked = (r.value === v); });
      } else if (t === "select"){
        var s = $("select", f); if (s) s.value = v;
      } else if (t === "multiselect"){
        $$("input[type=checkbox]", f).forEach(function(c){ c.checked = (v || []).indexOf(c.value) >= 0; });
      } else if (t === "contact"){
        $$("[data-part]", f).forEach(function(i){ i.value = (v && v[i.dataset.part]) || ""; });
      } else if (t === "relmatrix"){
        var byRel = {};
        (v || []).forEach(function(r){ byRel[r.relationship] = r; });
        $$("tr[data-rel]", f).forEach(function(tr){
          var r = byRel[tr.dataset.rel];
          $('[data-part="allowed"]', tr).checked = !!r;
          $$("input", tr).forEach(function(i){
            if (i.dataset.part !== "allowed") i.disabled = !r;
          });
          $('[data-part="min"]', tr).value = r ? (r.min || "") : "";
          $('[data-part="max"]', tr).value = r ? (r.max || "") : "";
          $('[data-part="notes"]', tr).value = r ? (r.notes || "") : "";
        });
      } else if (t === "rows"){
        var rf = $(".rows-field", f) || f.querySelector(".rows-field");
        $("tbody", rf).innerHTML = "";
        (v || []).forEach(function(row){
          var tr = addRow(rf);
          $$("[data-col]", tr).forEach(function(i){ i.value = row[i.dataset.col] || ""; });
        });
      } else if (t === "list"){
        var ta = $("textarea", f); if (ta) ta.value = (v || []).join("\n");
      } else if (t === "file"){
        $(".file-name", f).textContent = v || "";
      } else {
        var i = $("input,textarea", f); if (i) i.value = v;
      }
    }
    function hasValue(v){
      if (v == null) return false;
      if (typeof v === "string") return v.trim() !== "";
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v).some(function(k){ return hasValue(v[k]); });
      return true;
    }

    /* ---------- serialize / restore ---------- */
    function serialize(){
      var data = { prerequisites: $$(".prereq-check").map(function(c){ return c.checked; }), sections: {} };
      $$("section[data-section-key]").forEach(function(sec){
        var key = sec.dataset.sectionKey;
        if (sec.dataset.repeat){
          data.sections[key] = $$(".instance", sec).map(function(inst){
            var o = {};
            $$(".field", inst).forEach(function(f){ o[f.dataset.qid] = fieldValue(f); });
            return o;
          });
        } else {
          var o = {};
          $$(".field", sec).forEach(function(f){ o[f.dataset.qid] = fieldValue(f); });
          if (Object.keys(o).length) data.sections[key] = o;
        }
      });
      return data;
    }
    function restore(data){
      if (!data) return;
      (data.prerequisites || []).forEach(function(v, i){
        var c = $$(".prereq-check")[i]; if (c) c.checked = !!v;
      });
      $$("section[data-section-key]").forEach(function(sec){
        var key = sec.dataset.sectionKey, saved = (data.sections || {})[key];
        if (sec.dataset.repeat){
          var arr = Array.isArray(saved) && saved.length ? saved : [{}];
          $(".instances", sec).innerHTML = "";
          arr.forEach(function(instData){
            var inst = addInstance(sec);
            $$(".field", inst).forEach(function(f){ setFieldValue(f, instData[f.dataset.qid]); });
          });
        } else if (saved){
          $$(".field", sec).forEach(function(f){ setFieldValue(f, saved[f.dataset.qid]); });
        }
      });
    }
    var saveTimer = null;
    function save(){
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function(){
        try { localStorage.setItem(KEY, JSON.stringify(serialize())); } catch (e) {}
      }, 300);
    }

    /* ---------- section status rules ----------
       DEFAULT RULES (placeholder — Nithin will supply the final per-section
       started / in-progress / completed rules; replace sectionState() then):
       - "done"     : every required, client-owned answer in the section is filled
       - "progress" : at least one answer (any field) has a value
       - "none"     : nothing entered yet
       Returns {state, total, filled} where total/filled count required client fields. */
    function sectionState(sec){
      var total = 0, filled = 0, touched = 0;
      $$(".field", sec).forEach(function(f){
        if (f.closest(".instance-tpl")) return;
        var v = hasValue(fieldValue(f));
        if (v) touched++;
        if (f.dataset.required !== "Yes" || f.dataset.owner === "IIRM") return;
        total++;
        if (v) filled++;
      });
      var state = "none";
      if (total > 0 && filled >= total) state = "done";
      else if (touched > 0) state = "progress";
      return { state: state, total: total, filled: filled };
    }
    function paintSectionStates(){
      $$("section[data-section-key]").forEach(function(sec){
        if (sec.dataset.sectionKey.indexOf("review") === 0) return;
        var st = sectionState(sec);
        var pill = $(".status-pill", sec);
        if (pill){
          pill.className = "status-pill" +
            (st.state === "done" ? " state-done" : st.state === "progress" ? " state-progress" : "");
          pill.textContent = st.state === "done" ? "Completed"
            : st.state === "progress" ? "In progress" : "Not started";
        }
        var fill = $(".sec-progress-fill", sec);
        if (fill){
          var pct = st.total ? Math.round(st.filled / st.total * 100) : 0;
          fill.style.width = pct + "%";
          fill.dataset.state = st.state;
        }
        var chip = $('.toc a[data-for="' + sec.dataset.sectionKey + '"]');
        if (chip){
          var keep = chip.classList.contains("active") ? " active" : "";
          chip.className = (st.state === "done" ? "state-done"
            : st.state === "progress" ? "state-progress" : "") + keep;
        }
      });
    }

    /* ---------- live portal URL preview (P1) ---------- */
    function renderUrlPreview(f){
      var input = $("input", f);
      if (!input) return;
      var el = $(".url-preview", f);
      if (!el){
        el = document.createElement("p");
        el.className = "url-preview";
        input.insertAdjacentElement("afterend", el);
      }
      var slug = input.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      var suffix = (document.body.dataset && document.body.dataset.domainSuffix) || ".iwh.indiainsure.com";
      if (slug){
        el.innerHTML = "Your portal address will be: <strong>https://" + slug + suffix + "/</strong>";
        el.classList.remove("empty");
      } else {
        el.textContent = "Type a sub-domain above to preview your portal address.";
        el.classList.add("empty");
      }
    }
    function initUrlPreview(){
      $$('.field[data-qid="P1"]').forEach(renderUrlPreview);
      document.addEventListener("input", function(e){
        var f = e.target.closest && e.target.closest('.field[data-qid="P1"]');
        if (f) renderUrlPreview(f);
      });
    }

    /* ---------- stage counts / policy titles / datalist / scrollspy ---------- */
    function updateStageCounts(){
      $$(".stage").forEach(function(st){
        var checks = $$(".prereq-check", st);
        var ready = checks.filter(function(c){ return c.checked; }).length;
        var chip = $(".stage-count", st);
        if (chip) chip.textContent = ready + " / " + checks.length;
        st.classList.toggle("stage-done", checks.length > 0 && ready === checks.length);
      });
    }
    function updateInstanceTitles(){
      $$("section[data-repeat]").forEach(function(sec){
        $$(".instance", sec).forEach(function(inst, i){
          var ref = $('.field[data-qid="PL1"] select, .field[data-qid="EN1"] input, .field[data-qid="DC1"] input', inst);
          var suffix = ref && ref.value ? " \u2014 " + ref.value : "";
          $(".inst-num", inst).textContent = (i + 1) + suffix;
        });
      });
    }
    function updatePolicyDatalist(){
      var dl = $("#policyOptions");
      if (!dl){
        dl = document.createElement("datalist");
        dl.id = "policyOptions";
        document.body.appendChild(dl);
      }
      var names = [];
      $$('section[data-section-key="policy-details-coverage"] .instance').forEach(function(inst){
        var n = $('.field[data-qid="PL2"] input', inst);
        var t = $('.field[data-qid="PL1"] select', inst);
        var v = (n && n.value.trim()) || (t && t.value) || "";
        if (v && names.indexOf(v) < 0) names.push(v);
      });
      dl.innerHTML = names.map(function(n){
        return '<option value="' + n.replace(/"/g, "&quot;") + '"></option>';
      }).join("");
      $$('.field[data-qid="EN1"] input, .field[data-qid="DC1"] input').forEach(function(i){
        i.setAttribute("list", "policyOptions");
      });
    }
    function initScrollSpy(){
      if (!("IntersectionObserver" in window)) return;
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (!e.isIntersecting) return;
          $$(".toc a").forEach(function(a){ a.classList.remove("active"); });
          var key = e.target.dataset.sectionKey;
          var a = key ? $('.toc a[data-for="' + key + '"]') : $('.toc a[href="#' + e.target.id + '"]');
          if (a) a.classList.add("active");
        });
      }, { rootMargin: "-15% 0px -75% 0px" });
      $$("section.card").forEach(function(sec){ obs.observe(sec); });
    }

    /* ---------- progress + prereq count ---------- */
    function updateProgress(){
      var total = 0, filled = 0;
      $$(".field").forEach(function(f){
        if (f.dataset.required !== "Yes" || f.dataset.owner === "IIRM") return;
        if (f.closest(".instance-tpl")) return;
        total++;
        if (hasValue(fieldValue(f))) filled++;
      });
      var pct = total ? Math.round(filled / total * 100) : 0;
      $("#progressFill").style.width = pct + "%";
      $("#progressLabel").textContent = filled + " of " + total + " required answers filled (" + pct + "%)";
      var checks = $$(".prereq-check");
      var ready = checks.filter(function(c){ return c.checked; }).length;
      $("#prereqCount").textContent = ready + " / " + checks.length + " ready";
      updateStageCounts();
      updateInstanceTitles();
      updatePolicyDatalist();
      paintSectionStates();
      return { total: total, filled: filled };
    }

    /* ---------- exports ---------- */
    function formatValue(v){
      if (v == null) return "";
      if (typeof v === "string") return v;
      if (Array.isArray(v)){
        if (!v.length) return "";
        if (typeof v[0] === "object"){
          return v.map(function(r){
            return Object.keys(r).map(function(k){ return k + ": " + r[k]; }).join(", ");
          }).join(" || ");
        }
        return v.join("; ");
      }
      if (typeof v === "object"){
        return Object.keys(v).filter(function(k){ return v[k]; })
          .map(function(k){ return k.charAt(0).toUpperCase() + k.slice(1) + ": " + v[k]; }).join("; ");
      }
      return String(v);
    }
    function companySlug(){
      var f = $('.field[data-qid="C1"]');
      var name = f ? String(fieldValue(f)) : "";
      return (name || "draft").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "draft";
    }
    function download(name, mime, content){
      var blob = new Blob([content], { type: mime });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
    }
    function missingRequired(){
      var miss = [];
      $$(".field").forEach(function(f){
        if (f.dataset.required !== "Yes" || f.dataset.owner === "IIRM") return;
        if (f.closest(".instance-tpl")) return;
        if (!hasValue(fieldValue(f))) miss.push(f.dataset.qid);
      });
      return Array.from(new Set(miss));
    }
    function exportJson(){
      var payload = {
        form: document.title,
        version: document.body.dataset.version || "",
        exported_at: new Date().toISOString(),
        missing_required: missingRequired(),
        data: serialize()
      };
      download("IBP-Intake_" + companySlug() + ".json", "application/json",
               JSON.stringify(payload, null, 2));
      noteMissing("JSON downloaded.");
    }
    function csvEscape(s){
      s = String(s);
      if (/^[=+\-@\t]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    }
    function exportCsv(){
      var rows = [["Section", "Instance", "ID", "Question", "Answer"]];
      $$("section[data-section-key]").forEach(function(sec){
        var title = $("h2", sec).textContent.trim();
        var scopes = sec.dataset.repeat ? $$(".instance", sec) : [sec];
        scopes.forEach(function(scope, idx){
          var inst = sec.dataset.repeat ? (sec.dataset.repeat + " " + (idx + 1)) : "";
          $$(".field", scope).forEach(function(f){
            rows.push([title, inst, f.dataset.qid, f.dataset.label, formatValue(fieldValue(f))]);
          });
        });
      });
      var csv = "\uFEFF" + rows.map(function(r){ return r.map(csvEscape).join(","); }).join("\r\n");
      download("IBP-Intake_" + companySlug() + ".csv", "text/csv;charset=utf-8", csv);
      noteMissing("Excel (CSV) downloaded.");
    }
    function noteMissing(prefix){
      var miss = missingRequired();
      $("#missingNote").textContent = miss.length
        ? prefix + " Note: " + miss.length + " required answer(s) still empty: " + miss.join(", ")
        : prefix + " All required answers are filled.";
      toast(prefix);
    }

    /* ---------- database submission (stub) ----------
       TODO: wire this once the storage specs are written.
       Expected shape: POST <endpoint> with the same payload as exportJson(). */
    function submitToDatabase(payload){ /* pending specs */ }

    /* ---------- summary ---------- */
    function buildSummary(){
      var out = [];
      $$("section[data-section-key]").forEach(function(sec){
        var title = $("h2", sec).textContent.trim();
        if (sec.dataset.sectionKey.indexOf("review") === 0) return;
        var scopes = sec.dataset.repeat ? $$(".instance", sec) : [sec];
        var block = "";
        scopes.forEach(function(scope, idx){
          var items = "";
          $$(".field", scope).forEach(function(f){
            var v = formatValue(fieldValue(f));
            if (!v) return;
            items += "<dt>" + f.dataset.qid + " — " + f.dataset.label + "</dt><dd>" +
                     v.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</dd>";
          });
          if (!items) return;
          if (sec.dataset.repeat) block += "<h5>" + sec.dataset.repeat + " " + (idx + 1) + "</h5>";
          block += "<dl>" + items + "</dl>";
        });
        if (block) out.push("<h4>" + title + "</h4>" + block);
      });
      $("#summary").innerHTML = out.length ? out.join("") :
        '<p class="help">Nothing entered yet.</p>';
    }

    /* ---------- misc ---------- */
    var toastTimer = null;
    function toast(msg){
      var t = $("#toast");
      t.textContent = msg; t.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 2600);
    }
    function initHeader(){
      $("#internalToggle").addEventListener("change", function(e){
        document.body.classList.toggle("show-internal", e.target.checked);
      });
    }
    function initExport(){
      $("#btnJson").addEventListener("click", exportJson);
      $("#btnCsv").addEventListener("click", exportCsv);
      $("#btnSummary").addEventListener("click", buildSummary);
      $("#btnClear").addEventListener("click", function(){
        if (!confirm("Clear all answers on this form? This cannot be undone.")) return;
        clearTimeout(saveTimer);
        localStorage.removeItem(KEY);
        location.reload();
      });
    }
    function initDefaults(){
      var today = $('.field[data-qid="C6"] input[type=date]');
      if (today && !today.value) today.value = new Date().toISOString().slice(0, 10);
    }

    document.addEventListener("DOMContentLoaded", function(){
      fixStaticNames();
      initRepeats(); initRows(); initFiles(); initHeader(); initExport();
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
      if (saved){ restore(saved); }
      else { $$("section[data-repeat]").forEach(function(sec){ addInstance(sec); }); }
      initDefaults();
      initScrollSpy();
      initUrlPreview();
      document.addEventListener("input", function(){ save(); updateProgress(); });
      document.addEventListener("change", function(){ save(); updateProgress(); });
      updateProgress();
    });
    })();
    '''

    # ------------------------------------------------------------------ build ---

    def build():
        text = MD_PATH.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)
        body = strip_comments(body)
        welcome, prereq_intro, prereq_stages, sections = parse_document(body)
        logo = logo_data_uri(meta)

        title = meta.get("form_title", "IBP Intake Form")
        subtitle = meta.get("form_subtitle", "")
        version = meta.get("form_version", "")
        fdate = meta.get("form_date", "")

        toc_links = []
        section_html = []
        last_part = None
        for i, s in enumerate(sections, 1):
            if s.get("part") and s["part"] != last_part:
                last_part = s["part"]
                section_html.append(
                    f'<div class="part-band" id="part-{slugify(s["part"])}">'
                    f'<span class="part-eyebrow">Part</span>'
                    f'<h2>{html.escape(s["part"])}</h2></div>')
                toc_links.append(f'<span class="toc-part">{html.escape(s["part"])}</span>')
            slug = slugify(s["title"])
            label = re.sub(r"^\d+\.\s*", "", s["title"])
            ts = (f'<span class="toc-s st-{s["stage"]}">S{s["stage"]}</span>'
                  if s.get("stage") else "")
            toc_links.append(f'<a href="#{slug}" data-for="{slug}">'
                             f'<span class="dot"></span>{i}. {html.escape(label)}{ts}</a>')
            section_html.append(render_section(s, i))

        body_content = f'''
    <header class="site-header">
      <div class="head-inner">
        <div class="logo-chip"><img src="__LOGO__" alt="IIRM logo"></div>
        <div class="head-titles">
          <h1>{html.escape(title)}</h1>
          <p>{html.escape(subtitle)}</p>
        </div>
        <div class="head-right">
          <label class="toggle"><input type="checkbox" id="internalToggle"> Show IIRM notes</label>
          <span class="version-chip">{html.escape(version)} · {html.escape(fdate)}</span>
        </div>
      </div>
      <div class="progress-rail"><div class="progress-fill" id="progressFill"></div></div>
      <div class="progress-label" id="progressLabel"></div>
    </header>
    <div class="page">
    <nav class="toc" aria-label="Sections">
      <a href="#prerequisites">Pre-requisites</a>
      {''.join(toc_links)}
    </nav>
    <main>
      {render_welcome(welcome, title)}
      {render_prereqs(prereq_intro, prereq_stages)}
      {''.join(section_html)}
    </main>
    </div>
    {render_footer(meta)}
    <div class="toast" id="toast" role="status"></div>
    '''
        body_content = body_content.replace("__LOGO__", logo)

        standalone = f'''<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{html.escape(title)}</title>
    <style>{CSS}</style>
    </head>
    <body data-version="{html.escape(version, quote=True)}" data-domain-suffix="{html.escape(meta.get("portal_domain_suffix", ".iwh.indiainsure.com"), quote=True)}">
    {body_content}
    <script>{JS}</script>
    </body>
    </html>
    '''
        out = HERE / meta.get("output_html", "IBP-Intake-Form.html")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(standalone, encoding="utf-8")

        n_q = sum(len(g["questions"]) for s in sections for g in s["groups"])
        print(f"OK: {out.name}  ({len(standalone)//1024} KB, "
              f"{len(sections)} sections, {n_q} questions, {sum(len(st["items"]) for st in prereq_stages)} pre-requisites)")
        return standalone, body_content, title, version, CSS, JS

    return build()


# ═════════════════════════════════════════════════════════════════════════════
# 2. GO-LIVE DEFINITION v2 WORKBOOK (v1 xlsx + config inventory -> v2 xlsx)
# ═════════════════════════════════════════════════════════════════════════════

def cmd_golive_xlsx():
    DOCS = Path(__file__).resolve().parent
    V1_XLSX = DOCS / "IBP-Go-Live-Definition-v1-HandEdited.xlsx"       # hand-edited source for A & C
    INVENTORY = DOCS / "ibp_golive_config_inventory.json"                # code-grounded source for B
    OUT = DOCS / "IBP-Go-Live-Definition-v2.xlsx"

    # ── unified columns ────────────────────────────────────────────────────────────
    COLUMNS = [
        ("Ref", 7),
        ("Group / Area", 26),
        ("Item / Feature", 34),
        ("Description — what's needed", 50),
        ("Allowed Values (from code)", 30),
        ("Owner / Access", 18),
        ("Where Configured", 52),
        ("Feature Flag", 22),
        ("Status", 16),
    ]

    # ── Section B curation rules ─────────────────────────────────────────────────────
    # Whole groups that are internal CRM-sales / policy financial-master — not portal go-live.
    DROP_GROUPS = {
        "Company Ownership / Team",
        "Company CRM Profile (company_detail)",
        "Policy Master - Premium & Brokerage",
        "Policy Master - RCON",
        "Company-level IBP Portal config (other agent - noted only)",
        "Connector Service",
        "Content Type Keys / Identity",        # companyId/policyId set automatically by platform
        "Policy Configuration persistence (backend)",  # internal JSON blob — not a client input
    }
    # Noise items inside otherwise-kept groups (substring match on item text).
    DROP_ITEM_SUBSTRINGS = [
        "Status / Priority / Sentiment",
        "Source / Source type",
        "Annual premium",
        "Is Policy Mined",
        "Opportunity Type",
        "Policy Owner (BD",
        "Nature of Business",
    ]
    # Keep but flag for Tech-Lead review. Match on the ITEM NAME (a field literally named
    # "...orphaned"/"...NOT wired" is genuinely unwired) OR a SPECIFIC note phrase that says the
    # whole item is unbuilt. Bare words like "legacy"/"orphaned" in a note sub-clause (e.g. "accepts
    # the legacy field path", "a sub-component is orphaned") must NOT flag an otherwise-live field.
    VERIFY_ITEM_KEYWORDS = [
        "orphaned", "not currently", "defined but not", "not wired",
        "not exposed", "unwired", "planned", "deprecated",
    ]
    VERIFY_NOTE_PHRASES = [
        "does not currently render", "not currently a saved", "defined but not wired",
        "not yet wired", "orphaned component", "not rendered", "no ui control",
    ]
    # Self-declared duplicates the explorers tagged — drop outright.
    DUP_KEYWORDS = ["duplicate"]

    # Domain index (order in the JSON) -> Section B sub-section banner.
    # Domain 0 (Company/Tenant) is omitted — company creation is handled internally by IIRM.
    DROP_DOMAINS = {0}
    SUBSECTION_TITLES = {
        1: "B1. Authentication & Password Policy",
        2: "B2. Policy Master & Policy-Portal Configuration",
        3: "B3. Policy Configuration — Constraints (Dependent Eligibility)",
        4: "B4. Policy Configuration — Enrollment & Premium",
        5: "B5. Content Management (Strapi)",
        6: "B6. Integrations, SSO & Notifications",
    }
    # B4 (constraints) and B5 (enrollment) overlap — dedupe B5 against B4 by canonical key.
    DEDUP_AGAINST_PREVIOUS = {4: [3]}

    FF_RE = re.compile(r"FF_[A-Z0-9_]+")

    _CODE_RE = re.compile(
        r'apps/(services|ui)/'              # file paths
        r'|src/'
        r'|\.(ts|tsx|js|jsx|py|json):'
        r'|\w+-service\b'                   # microservice names e.g. org-service, config-service
        r'|GET /|POST /|PUT /|PATCH /'      # HTTP method + path
        r'|\b\w+\.\w+_\w+'                  # table.column_name e.g. company.company_name
        r'|\(FK '                           # DB FK notation
        r'|/:[\w]'                          # URL params e.g. /:subdomain
        r'|DEFAULT_VALUES\.'                # UI code constants
        r'|\bColumn\s+\w+\.'               # "Column table.field"
        r'|varchar\(|timestamptz|NOT NULL'  # SQL types/constraints
        r'|ENV\.'                           # environment variables
        r'|environment\.featureFlag'        # code paths
        r'|jsonData\.'                      # code access patterns
        r'|METHOD_CODES|roleKey\s'          # code constants
        r'|step1\s+https?://|step2\s+'     # API step refs
        r'|getConfig|seedDefault'           # internal method names
    )

    # Sentence-start phrases that signal "implementation detail, not client content"
    _IMPL_SIGNAL_RE = re.compile(
        r'(Stored (value|as)\b|UI default\b|UI helper\b|Backend default\b'
        r'|State \w+ (exists|with)\b|emitted only\b'
        r'|Boolean feature flag\b|Only wired\b|Not (currently|per-company)\b)',
        re.IGNORECASE,
    )


    def _strip_code(text: str) -> str:
        """Remove code-internal content from a cell.

        Two levels:
        1. Whole lines containing code refs are dropped.
        2. Within a line, semicolon-segments containing code refs are dropped.
        """
        clean_lines = []
        for line in text.split('\n'):
            if not line.strip():
                continue
            segments = [s for s in re.split(r';\s*', line) if not _CODE_RE.search(s)]
            if segments:
                clean_lines.append('; '.join(segments))
        return '\n'.join(clean_lines).strip()


    def _clean_options(text: str) -> str:
        """Strip code details from an options/values field.

        Keeps the human-readable option list at the start and drops trailing
        implementation-detail sentences (stored values, code defaults, SQL types, etc.).
        """
        # Drop parentheticals that are purely code refs e.g. "(in METHOD_CODES ...)"
        text = re.sub(r'\(in [A-Z_]+[^)]*\)', '', text)
        # Split into sentences and stop at the first implementation-detail sentence
        sentences = re.split(r'\.\s+', text)
        clean = []
        for s in sentences:
            if _CODE_RE.search(s) or _IMPL_SIGNAL_RE.search(s):
                break
            clean.append(s)
        result = '. '.join(clean).strip(' .')
        # Final pass: strip any remaining code refs at line/segment level
        return _strip_code(result) if _CODE_RE.search(result) else result


    # Filler words stripped so near-identical labels in two tabs collapse to one key.
    # Deliberately excludes "employee"/"company" so company-vs-employee toggles stay distinct.
    _STOPWORDS = {"to", "the", "their", "a", "an", "of", "for", "is", "are",
                  "be", "display", "shown", "employees", "before"}


    def canonical(item: str) -> str:
        """Normalise an item label so the same toggle in two tabs collapses to one key."""
        s = item.lower()
        s = re.sub(r"\([^)]*\)", " ", s)        # drop parentheticals
        s = re.sub(r"[^a-z0-9 ]", " ", s)       # drop punctuation
        words = [w for w in s.split() if w not in _STOPWORDS]
        return " ".join(words)


    def extract_flag(*texts: str) -> str:
        for t in texts:
            if t:
                m = FF_RE.findall(t)
                if m:
                    return " / ".join(sorted(set(m)))
        return ""


    def fmt_code_refs(refs, cap=4) -> str:
        refs = [r for r in (refs or []) if r]
        if not refs:
            return ""
        shown = refs[:cap]
        out = "; ".join(shown)
        if len(refs) > cap:
            out += f"  (+{len(refs) - cap} more)"
        return out


    def build_section_b():
        """Return (rows, stats). rows = list of ('sub'|'row', payload)."""
        data = json.loads(INVENTORY.read_text())
        domains = data["domains"]
        rows, stats = [], {"kept": 0, "dropped": 0, "flagged": 0, "deduped": 0}
        seen_by_domain = {}  # domain index -> set(canonical keys kept)

        for di, dom in enumerate(domains):
            if di in DROP_DOMAINS:
                continue
            sub_rows, kept_keys = [], set()
            prior_keys = set()
            for src in DEDUP_AGAINST_PREVIOUS.get(di, []):
                prior_keys |= seen_by_domain.get(src, set())

            ref_n = 0
            for it in dom["items"]:
                group = it.get("group", "")
                item = it.get("item", "")
                notes = it.get("notes", "") or ""
                item_l, notes_l = item.lower(), notes.lower()

                if group in DROP_GROUPS:
                    stats["dropped"] += 1
                    continue
                if any(s.lower() in item.lower() for s in DROP_ITEM_SUBSTRINGS):
                    stats["dropped"] += 1
                    continue
                if any(k in f"{item_l} {notes_l}" for k in DUP_KEYWORDS):
                    stats["dropped"] += 1
                    continue

                key = canonical(item)
                if key in prior_keys or key in kept_keys:
                    stats["deduped"] += 1
                    continue
                kept_keys.add(key)

                flagged = (any(k in item_l for k in VERIFY_ITEM_KEYWORDS)
                           or any(p in notes_l for p in VERIFY_NOTE_PHRASES))
                status = "Verify w/ Tech Lead" if flagged else it.get("mandatory", "")
                if flagged:
                    stats["flagged"] += 1

                desc = _strip_code(it.get("input_needed", "") or "")
                options = _clean_options(it.get("options_or_values", "") or "")
                where_cell = _strip_code(it.get("where_configured", "") or "")

                flag = extract_flag(item, notes, where_cell, it.get("options_or_values", ""))
                ref_n += 1
                sub_rows.append((
                    f"B{di + 1}.{ref_n}", group, item, desc,
                    options, it.get("owner", "") or "",
                    where_cell, flag, status,
                ))
                stats["kept"] += 1

            seen_by_domain[di] = kept_keys
            if sub_rows:
                rows.append(("sub", SUBSECTION_TITLES.get(di, dom["domain"])))
                rows.extend(("row", r) for r in sub_rows)
        return rows, stats


    # ── read Sections A & C from the hand-edited v1 xlsx ─────────────────────────────
    def read_v1_sections():
        wb = load_workbook(V1_XLSX, data_only=True)
        ws = wb.active
        grid = [[c.value for c in row] for row in ws.iter_rows()]

        a_rows, c_rows, section = [], [], None
        for r in grid:
            first = (str(r[0]).strip() if r[0] is not None else "")
            if first.startswith("A.") and "PRE-REQUISITE" in first.upper():
                section = "A"; continue
            if first.startswith("B.") and "FUNCTIONAL" in first.upper():
                section = "C"; continue
            if first in ("Sl. #",) or first == "":
                if not any(c not in (None, "") for c in r):
                    continue
                if first == "Sl. #":
                    continue
            if section == "A" and first.startswith("A"):
                a_rows.append(r)
            elif section == "C" and (isinstance(r[0], int) or first.isdigit()):
                c_rows.append(r)
        return a_rows, c_rows


    # v1 columns: Sl# | Module/Area | Feature/Item | Owner-or-AccessTo | Description | Status
    A_FLAGS = [("branding", "FF_COMPANY_LOGO"), ("authentication", "FF_MULTI_AUTH / FF_PASSWORD_RULES"),
               ("terms & conditions", "FF_IBP_CONSENT_MANAGEMENT"), ("consent", "FF_IBP_CONSENT_MANAGEMENT")]
    C_FLAGS = [("email otp", "FF_MULTI_AUTH"), ("phone otp", "FF_MULTI_AUTH"),
               ("claim submission", "FF_CLAIM_INTIMATION_MANAGEMENT"),
               ("claim intimation", "FF_CLAIM_INTIMATION_MANAGEMENT"),
               ("life events", "FF_LIFE_EVENT_DEPENDENT_MANAGEMENT"),
               ("hospital network", "FF_SHOW_SYNCED_HOSPITALS")]


    def flag_for(text, table):
        t = (text or "").lower()
        for kw, flag in table:
            if kw in t:
                return flag
        return ""


    def map_v1_to_unified(v1_rows, flag_table):
        """v1 row -> unified 9-col tuple."""
        out = []
        for r in v1_rows:
            ref = str(r[0]).strip()
            area, item, owner_access, desc, status = r[1], r[2], r[3], r[4], r[5]
            flag = flag_for(item, flag_table)
            out.append((ref, area or "", item or "", desc or "", "", owner_access or "", "", flag, status or ""))
        return out


    # ── styling (matches v1 generator) ───────────────────────────────────────────────
    NAVY = "1F3864"
    SECTION_BLUE = "2E5FA3"
    SUB_BLUE = "8FAADC"
    HEADER_GREY = "D9E2F3"
    STRIPE = "F4F7FC"
    FLAG_AMBER = "FFF3CD"

    thin = Side(style="thin", color="B0B7C3")
    BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
    WRAP = Alignment(wrap_text=True, vertical="top")
    CENTER = Alignment(horizontal="center", vertical="top", wrap_text=True)
    CENTER_COLS = (1, 6, 8, 9)
    AMBER_STATUSES = {"Flag-gated", "Verify w/ Tech Lead"}


    def write_header_row(ws, row):
        for col, (name, _) in enumerate(COLUMNS, start=1):
            c = ws.cell(row=row, column=col, value=name)
            c.font = Font(bold=True, color=NAVY)
            c.fill = PatternFill("solid", fgColor=HEADER_GREY)
            c.border = BORDER
            c.alignment = CENTER
        return row + 1


    def write_section_title(ws, row, title, color=SECTION_BLUE, size=12):
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=len(COLUMNS))
        c = ws.cell(row=row, column=1, value=title)
        c.font = Font(bold=True, size=size, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor=color)
        c.alignment = Alignment(vertical="center")
        ws.row_dimensions[row].height = 22
        return row + 1


    def write_data_rows(ws, row, rows):
        i = 0
        for r in rows:
            amber = str(r[8]) in AMBER_STATUSES
            stripe = (i % 2 == 1)
            for col, value in enumerate(r, start=1):
                c = ws.cell(row=row, column=col, value=value)
                c.border = BORDER
                c.alignment = CENTER if col in CENTER_COLS else WRAP
                if amber:
                    c.fill = PatternFill("solid", fgColor=FLAG_AMBER)
                elif stripe:
                    c.fill = PatternFill("solid", fgColor=STRIPE)
            row += 1
            i += 1
        return row


    def main():
        a_rows_raw, c_rows_raw = read_v1_sections()
        section_a = map_v1_to_unified(a_rows_raw, A_FLAGS)
        section_c = map_v1_to_unified(c_rows_raw, C_FLAGS)
        section_b, stats = build_section_b()

        wb = Workbook()
        ws = wb.active
        ws.title = "IBP Go-Live Definition v2"
        ws.sheet_view.showGridLines = False
        for col, (_, width) in enumerate(COLUMNS, start=1):
            ws.column_dimensions[get_column_letter(col)].width = width

        # title block
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(COLUMNS))
        t = ws.cell(row=1, column=1,
                    value="IBP — Integrated Benefits Portal | Go-Live Definition v2 (Pre-requisites + Configuration + Production Features)")
        t.font = Font(bold=True, size=14, color="FFFFFF")
        t.fill = PatternFill("solid", fgColor=NAVY)
        t.alignment = Alignment(vertical="center")
        ws.row_dimensions[1].height = 30

        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(COLUMNS))
        s = ws.cell(row=2, column=1,
                    value="One subdomain per client company (e.g. https://democorporation.iwh.indiainsure.com)  |  "
                          "Section B is code-grounded (file:line refs)  |  Amber = Flag-gated / Verify with Tech Lead  |  "
                          "Prepared 15 June 2026")
        s.font = Font(italic=True, size=9, color="44546A")
        s.alignment = Alignment(vertical="center", wrap_text=True)

        row = 4
        row = write_section_title(ws, row, "A. PRE-REQUISITES — PORTAL GO-LIVE")
        row = write_header_row(ws, row)
        row = write_data_rows(ws, row, section_a)

        row += 1
        row = write_section_title(ws, row, "B. CONFIGURATION BY DOMAIN — CODE-GROUNDED (what the owner must set / provide)")
        row = write_header_row(ws, row)
        for kind, payload in section_b:
            if kind == "sub":
                row = write_section_title(ws, row, payload, color=SUB_BLUE, size=11)
            else:
                row = write_data_rows(ws, row, [payload])

        row += 1
        row = write_section_title(ws, row, "C. FUNCTIONAL FEATURES — IN PRODUCTION")
        row = write_header_row(ws, row)
        write_data_rows(ws, row, section_c)

        ws.freeze_panes = "A4"
        wb.save(OUT)
        b_count = sum(1 for k, _ in section_b if k == "row")
        print(f"Wrote {OUT}")
        print(f"  A. Pre-requisites : {len(section_a)} rows")
        print(f"  B. Configuration  : {b_count} rows  (kept={stats['kept']} dropped={stats['dropped']} "
              f"deduped={stats['deduped']} flagged-verify={stats['flagged']})")
        print(f"  C. Functional     : {len(section_c)} rows")

    return main()


# ═════════════════════════════════════════════════════════════════════════════
# 3. SETUP QUESTIONNAIRE WORKBOOK (legacy Excel intake channel)
# ═════════════════════════════════════════════════════════════════════════════

def cmd_questionnaire_xlsx():
    # ── Colours ──────────────────────────────────────────────────────────────────
    C = {
        "sec_hdr":    "1F4E79",   # dark navy  – section divider
        "pol_iirm":   "1E5C1A",   # dark green – policy IIRM-filled header
        "inception":  "FCE5CD",   # peach      – inception pre-check
        "client":     "DEEAF1",   # light blue – client fills
        "iirm":       "FFF2CC",   # light gold – IIRM fills / steps
        "both":       "E2EFDA",   # light green – shared
        "info":       "F3F3F3",   # grey        – informational / static
        "notif":      "EAF4FB",   # pale blue   – notifications
        "col_hdr":    "2B547E",   # mid-navy    – column header row
    }

    def fill(hex_color):
        return PatternFill("solid", fgColor=hex_color)

    def bold_font(color="000000", size=10):
        return Font(bold=True, color=color, size=size)

    def normal_font(size=10):
        return Font(size=size)

    def wrap_align(horizontal="left"):
        return Alignment(wrap_text=True, vertical="top", horizontal=horizontal)

    thin = Side(style="thin", color="CCCCCC")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    # ── Data Validation helpers ───────────────────────────────────────────────────
    def dv(formula, sqref):
        d = DataValidation(type="list", formula1=formula, allow_blank=True)
        d.sqref = sqref
        d.showErrorMessage = False
        return d

    YES_NO      = '"Yes,No"'
    YES_NO_NA   = '"Yes,No,N/A"'
    STATUS      = '"Pending,Done,N/A"'
    ON_OFF      = '"On,Off"'

    # ── Row data ─────────────────────────────────────────────────────────────────
    # Each item: (row_type, section, item, client_input_hint, dv_formula, iirm_steps, owner)
    # row_type: SEC / POL_HDR / INCEPT / DATA / INFO / NOTIF

    ROWS = [

        # ── SECTION 1 ─────────────────────────────────────────────────────────────
        ("SEC",  "1. Company & Project Information", "", "", "", "", ""),

        ("DATA", "Company Info", "Company / Organisation legal name",
         "Type here", None,
         "Use this name to create the company master record in the system.",
         "Client"),

        ("DATA", "Company Info", "Primary contact — Name",
         "Type here", None, "Save as the main point of contact in the project record.", "Client"),

        ("DATA", "Company Info", "Primary contact — Email",
         "Type here", None, "", "Client"),

        ("DATA", "Company Info", "Primary contact — Phone",
         "Type here", None, "", "Client"),

        ("DATA", "Company Info", "Number of employees / users (approx.)",
         "Type here", None, "Used for capacity planning.", "Client"),

        ("DATA", "Company Info", "Countries the portal will serve",
         '"India,Sri Lanka,Both"', '"India,Sri Lanka,Both"',
         "Set the country flag on each policy configuration accordingly.",
         "Client"),

        ("DATA", "Company Info", "Target go-live date",
         "DD-MMM-YYYY", None, "Track against implementation milestones.", "Client"),

        ("DATA", "Company Info", "Portal type",
         '"Company-Specific,Universal"', '"Company-Specific,Universal"',
         "Determines whether the company logo appears on the login screen (Company-Specific) or only post-login (Universal).",
         "Client"),

        ("DATA", "Company Info", "Date this form is submitted",
         "DD-MMM-YYYY", None, "Record receipt date.", "Client"),

        # ── SECTION 2 ─────────────────────────────────────────────────────────────
        ("SEC",  "2. Brand & Identity", "", "", "", "", ""),

        ("DATA", "Brand", "Company Logo  [Attach file — PNG/JPG/SVG, max 2 MB, 200×200 px, transparent background preferred]",
         "Write filename here", None,
         "1. Open iWork.  2. Go to Company Details.  3. Click Edit Company.  4. Go to Upload Logo.  5. Upload the file.",
         "Client"),

        ("INFO", "Brand", "Footer (company name, licence, copyright)  — Managed by IIRM. No input required.",
         "IIRM-managed", None,
         "Footer uses IIRM's standard branding. No action unless client provides custom URLs below.",
         "IIRM"),

        ("DATA", "Brand", "Privacy Policy URL — use IIRM default or provide your own?",
         '"Use IIRM default,Use our own — see notes"', '"Use IIRM default,Use our own — see notes"',
         "If client provides their own URL: update the footer privacy policy link in the portal configuration.",
         "Client"),

        ("DATA", "Brand", "Terms of Use URL — use IIRM default or provide your own?",
         '"Use IIRM default,Use our own — see notes"', '"Use IIRM default,Use our own — see notes"',
         "If client provides their own URL: update the footer terms of use link in the portal configuration.",
         "Client"),

        # ── SECTION 3 ─────────────────────────────────────────────────────────────
        ("SEC",  "3. Portal Access", "", "", "", "", ""),

        ("DATA", "Portal Access",
         "Preferred sub-domain  (portal will be: https://<sub-domain>.iwh.indiainsure.com/  — lowercase, numbers, hyphens only. Same sub-domain used across all environments.)",
         "Type sub-domain here", None,
         "1. Set the sub-domain in Portal Configuration → Company Tab.  2. Share with DevOps for DNS and SSL setup.",
         "Client"),

        ("DATA", "Portal Access", "How should employees log in?",
         '"Employee ID + Date of Birth,Email or Phone OTP,Other"',
         '"Employee ID + Date of Birth,Email or Phone OTP,Other"',
         "1. Open iWork.  2. Go to Authorization Configuration.  3. Set the login method for users.",
         "Client"),

        ("DATA", "Portal Access", "Multi-Factor Authentication (MFA)?",
         '"No,Email OTP,SMS / Phone OTP"', '"No,Email OTP,SMS / Phone OTP"',
         "Enable MFA and set the OTP channel in Authorization Configuration.",
         "Client"),

        ("DATA", "Portal Access", "Password — minimum length  (e.g. 8)",
         "Type number", None,
         "Set password rules in Authorization Configuration for this company.",
         "Client"),

        ("DATA", "Portal Access", "Password — maximum length  (e.g. 32)",
         "Type number", None, "", "Client"),

        ("DATA", "Portal Access", "Password complexity  (tick all that apply — type in cell)",
         "e.g. Uppercase, Digit, Special character", None,
         "Enter each required pattern in the password rules configuration.",
         "Client"),

        ("DATA", "Portal Access", "Allow only one active session per employee at a time?",
         YES_NO, YES_NO,
         "Configure session policy in Authorization settings. Default is single session.",
         "Client"),

        # ── SECTION 4 ─────────────────────────────────────────────────────────────
        ("SEC",  "4. Contacts & Escalations", "", "", "", "", ""),

        ("DATA", "Contacts", "Support hours  (e.g. Mon–Fri, 9:30–18:30 IST)",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → Support Timings.",
         "Client"),

        ("DATA", "Contacts", "HR Primary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → HR Contacts → Primary.",
         "Client"),

        ("DATA", "Contacts", "HR Secondary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → HR Contacts → Secondary.",
         "Client"),

        ("DATA", "Contacts", "Data Protection Officer (DPO) Primary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → DPO Contacts → Primary.",
         "Client"),

        ("DATA", "Contacts", "DPO Secondary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → DPO Contacts → Secondary.",
         "Client"),

        ("DATA", "Contacts", "Grievance Officer Primary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → Grievance Contacts → Primary.",
         "Client"),

        ("DATA", "Contacts", "Grievance Secondary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → Grievance Contacts → Secondary.",
         "Client"),

        ("DATA", "Contacts", "TPA Primary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → TPA → Primary.",
         "Client"),

        ("DATA", "Contacts", "TPA Secondary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → TPA → Secondary.",
         "Client"),

        ("DATA", "Contacts", "Broker (IIRM) Primary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → Broker → Primary.",
         "Client"),

        ("DATA", "Contacts", "Broker (IIRM) Secondary — Name, Phone, Email",
         "Type here", None,
         "Enter in Content Management → Company Template → Contact Matrix → Broker → Secondary.",
         "Client"),

        ("DATA", "HR Admin User", "HR Admin — Employee ID",
         "Type here", None,
         "Use this Employee ID to create the HR Admin portal account.",
         "Client"),

        ("DATA", "HR Admin User", "HR Admin — First Name",
         "Type here", None, "", "Client"),

        ("DATA", "HR Admin User", "HR Admin — Last Name",
         "Type here", None, "", "Client"),

        ("DATA", "HR Admin User", "HR Admin — Work Email",
         "Type here", None,
         "Send the HR admin welcome email to this address after account is created.",
         "Client"),

        ("DATA", "HR Admin User", "HR Admin — Designation / Role",
         "Type here", None, "", "Client"),

        # ── SECTION 5 — POLICY BLOCK ──────────────────────────────────────────────
        ("SEC",  "5. Policy Information — Policy Block 1", "", "", "", "", ""),

        ("POL_HDR", "Policy 1", "Policy Name",       "IIRM to fill", None, "", "IIRM"),
        ("POL_HDR", "Policy 1", "Policy Number",     "IIRM to fill", None, "", "IIRM"),
        ("POL_HDR", "Policy 1", "Policy Start Date", "IIRM to fill", None, "", "IIRM"),
        ("POL_HDR", "Policy 1", "Policy End Date",   "IIRM to fill", None, "", "IIRM"),

        ("INCEPT", "Policy 1 — Pre-requisite",
         "Has the inception file for this policy been submitted to IIRM?",
         YES_NO, YES_NO,
         "Confirm in the Service Flow — Inception process — before proceeding with configuration.",
         "Client"),

        ("DATA", "Policy 1 — About", "Key highlights — 3 to 5 bullet points for the policy card",
         "Type each point on a new line", None,
         "1. Open Content Management.  2. Find Policy Template.  3. Search by Policy Name.  4. Go to Info Points section.  5. Enter each bullet point.",
         "Client"),

        ("DATA", "Policy 1 — Enrollment", "Enrollment window — Start date",
         "DD-MMM-YYYY", None,
         "Set in iWork → Policy Configuration → Enrollment Tab → Start Date.",
         "Client"),

        ("DATA", "Policy 1 — Enrollment", "Enrollment window — End date  (hard cut-off)",
         "DD-MMM-YYYY", None,
         "Set in iWork → Policy Configuration → Enrollment Tab → End Date.",
         "Client"),

        # ── Constraints ───────────────────────────────────────────────────────────
        ("INFO", "Policy 1 — Constraints",
         "Policy constraints are loaded from the inception and endorsement data. IIRM to verify and update all constraints in iWork before the portal is activated.",
         "IIRM to complete", None,
         "Open iWork → Policy Configuration → Constraints Tab. Review each constraint against the inception data and update accordingly.",
         "IIRM"),

        ("DATA", "Policy 1 — Constraints", "Allow male employees to cover their own parents?",
         YES_NO, YES_NO,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints", "Allow male employees to cover their parents-in-law?",
         YES_NO, YES_NO,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints", "Allow female employees to cover their own parents?",
         YES_NO, YES_NO,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints", "Allow female employees to cover their parents-in-law?",
         YES_NO, YES_NO,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints", "Allow coverage for same-gender parent and parent-in-law?",
         YES_NO, YES_NO,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints",
         "Allow cross-selection of parents — one parent from the employee's side and one from the spouse's side?",
         YES_NO, YES_NO,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints", "Allow a second child born as twins to be covered under the policy?",
         YES_NO, YES_NO,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints",
         "Minimum age gap between employee and their parent — parent must be older  (enter number in years)",
         "Type number", None,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints", "Maximum age for a studying son  (enter number in years)",
         "Type number", None,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints", "Maximum age for an unmarried daughter  (enter number in years)",
         "Type number", None,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints",
         "Minimum age gap between employee and their child  (enter number in years)",
         "Type number", None,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        ("DATA", "Policy 1 — Constraints",
         "Number of payroll instalments for premium deduction  (enter number)",
         "Type number", None,
         "Set in iWork → Policy Configuration → Constraints Tab.", "Client"),

        # ── Enrollment (continued) ────────────────────────────────────────────────
        ("DATA", "Policy 1 — Enrollment", "Is enrollment confirmation required before final submission?",
         YES_NO, YES_NO,
         "Enable confirmation in iWork → Policy Configuration → Enrollment Tab.",
         "Client"),

        ("DATA", "Policy 1 — Enrollment", "Lock employee choices after they confirm enrollment?",
         YES_NO, YES_NO,
         "Set Auto-Lock in iWork → Policy Configuration → Enrollment Tab.",
         "Client"),

        ("DATA", "Policy 1 — Enrollment", "Automatically lock enrollment for all employees after the cut-off date?",
         YES_NO, YES_NO,
         "Configure auto-lock by cut-off date in iWork → Policy Configuration → Enrollment Tab.",
         "Client"),

        # ── Premium ───────────────────────────────────────────────────────────────
        ("DATA", "Policy 1 — Premium", "Show the company's contribution to employees?",
         YES_NO, YES_NO,
         "Set Show Company Contribution toggle in Content Management → Policy Template → Configuration.",
         "Client"),

        # ── Disclaimer ────────────────────────────────────────────────────────────
        ("DATA", "Policy 1 — Disclaimer", "Policy-level disclaimer text  (type N/A if none)",
         "Type full disclaimer here or N/A", None,
         "1. Open Content Management.  2. Find Policy Template.  3. Search by Policy Name.  4. Go to Disclaimer Notes.  5. Enter the text.",
         "Client"),

        ("DATA", "Policy 1 — Disclaimer",
         "Disclaimer acceptance mode — Mandatory or Optional  (applies to the disclaimer above)",
         '"Mandatory,Optional,N/A"', '"Mandatory,Optional,N/A"',
         "Set the acceptance mode field on the same Disclaimer Notes record in Content Management.",
         "Client"),

        # ── Documents ─────────────────────────────────────────────────────────────
        ("DATA", "Policy 1 — Documents", "Full Policy Document  [Attach file — PDF]",
         "Write filename here", None,
         "1. Open iWork.  2. Go to Policy Configuration.  3. Open Document Library.  4. Upload under Policy Wordings.",
         "Client"),

        ("DATA", "Policy 1 — Documents", "Short Policy Feature Document  [Attach file — PDF, 1–2 pages]",
         "Write filename here", None,
         "1. Open iWork.  2. Go to Policy Configuration.  3. Open Document Library.  4. Upload under Policy Feature Summary.",
         "Client"),

        ("DATA", "Policy 1 — Documents", "Claim Form  [Attach file — PDF or Excel]",
         "Write filename here", None,
         "1. Open iWork.  2. Go to Policy Configuration.  3. Open Claim Module Tab.  4. Upload the claim form template.",
         "Client"),

        ("DATA", "Policy 1 — Documents",
         "Network Hospital List  [Attach completed IIRM Excel template — health policies only]",
         "Write filename here or N/A", None,
         "1. Open iWork.  2. Go to Policy Configuration.  3. Open Hospital Network Tab.  4. Upload the completed Excel file.",
         "Client"),

        # ── SECTION 6 ─────────────────────────────────────────────────────────────
        ("SEC",  "6. Company-Wide Documents", "", "", "", "", ""),

        ("DATA", "Company Docs",
         "Consolidated Policy Features PDF — one PDF covering all policies  [Attach file]",
         "Write filename here", None,
         "1. Open iWork.  2. Go to Policy Details.  3. Open Portal Configuration Tab.  4. Upload under Consolidated Policy Features.",
         "Client"),

        ("DATA", "Company Docs",
         "Additional documents for the portal  (HR handbook, wellness guides, etc.)  [Attach files — optional]",
         "Write filenames here or N/A", None,
         "1. Open iWork.  2. Go to Company Details.  3. Open Configure IBP Portal Tab.  4. Upload the documents.",
         "Client"),

        # ── SECTION 7 ─────────────────────────────────────────────────────────────
        ("SEC",  "7. Dashboard & Employee Experience", "", "", "", "", ""),

        ("DATA", "Disclaimer",
         "Company-wide disclaimer text  (applies across the full portal, type N/A if none)",
         "Type full text here or N/A", None,
         "1. Open Content Management.  2. Find Company Template.  3. Search by Company Name.  4. Go to Disclaimer Notes.  5. Enter the text.",
         "Client"),

        ("DATA", "Disclaimer", "Company-wide disclaimer — acceptance mode",
         '"Mandatory,Optional,N/A"', '"Mandatory,Optional,N/A"',
         "Set the acceptance mode field on the same Disclaimer Notes record in Content Management.",
         "Client"),

        ("DATA", "Disclaimer", "Cookie consent banner copy  (optional — type N/A to use default)",
         "Type here or N/A", None,
         "Apply custom banner copy to the portal cookie consent configuration.",
         "Client"),

        ("NOTIF", "Notifications", "Enrollment confirmation email to employee",
         ON_OFF, ON_OFF, "Configure in Notification Service settings for this company.", "Both"),
        ("NOTIF", "Notifications", "E-Card availability email to employee",
         ON_OFF, ON_OFF, "Configure in Notification Service settings.", "Both"),
        ("NOTIF", "Notifications", "Claim status update email to employee",
         ON_OFF, ON_OFF, "Configure in Notification Service settings.", "Both"),
        ("NOTIF", "Notifications", "HR notified when employee submits a claim",
         ON_OFF, ON_OFF, "Configure in Notification Service settings.", "Both"),
        ("NOTIF", "Notifications", "HR notified when enrollment period closes",
         ON_OFF, ON_OFF, "Configure in Notification Service settings.", "Both"),

        # ── SECTION 8 ─────────────────────────────────────────────────────────────
        ("SEC",  "8. FAQs", "", "", "", "", ""),

        ("DATA", "FAQs",
         "Company-wide FAQs  [Return completed IIRM FAQ template — columns: Seq No | Category | Question | Answer]",
         "Write template filename here", None,
         "1. Open Content Management.  2. Find Company Template.  3. Search by Company Name.  4. Go to FAQs section.  5. Enter each FAQ from the completed template.",
         "Client"),

        # ── SIGN-OFF ──────────────────────────────────────────────────────────────
        ("SEC",  "Sign-Off", "", "", "", "", ""),

        ("DATA", "Sign-Off", "Prepared by (Client) — Name & Designation",  "Type here", None, "", "Client"),
        ("DATA", "Sign-Off", "Prepared by — Date",                          "DD-MMM-YYYY", None, "", "Client"),
        ("DATA", "Sign-Off", "Reviewed by (Client) — Name & Designation",  "Type here", None, "", "Client"),
        ("DATA", "Sign-Off", "Reviewed by — Date",                          "DD-MMM-YYYY", None, "", "Client"),
        ("DATA", "Sign-Off", "Authorised Signatory — Name & Designation",  "Type here", None, "", "Client"),
        ("DATA", "Sign-Off", "Authorised Signatory — Date",                "DD-MMM-YYYY", None, "", "Client"),
        ("DATA", "Sign-Off", "IIRM Implementation Manager — Name",         "Type here", None, "", "IIRM"),
        ("DATA", "Sign-Off", "IIRM Implementation Manager — Date",         "DD-MMM-YYYY", None, "", "IIRM"),
    ]

    # ── Build workbook ────────────────────────────────────────────────────────────
    wb = Workbook()
    ws = wb.active
    ws.title = "IBP Setup"

    # Column widths
    ws.column_dimensions["A"].width = 28   # Section
    ws.column_dimensions["B"].width = 55   # Item / Question
    ws.column_dimensions["C"].width = 32   # Client Input
    ws.column_dimensions["D"].width = 52   # IIRM Steps
    ws.column_dimensions["E"].width = 10   # Owner
    ws.column_dimensions["F"].width = 12   # Status

    # ── Column header row ────────────────────────────────────────────────────────
    headers = ["Section", "Item / Question", "Client Input", "IIRM Steps", "Owner", "Status"]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.fill = fill(C["col_hdr"])
        cell.font = bold_font("FFFFFF", 11)
        cell.alignment = wrap_align("center")
        cell.border = border
    ws.row_dimensions[1].height = 22
    ws.freeze_panes = "A2"

    # ── Render rows ───────────────────────────────────────────────────────────────
    row_num = 2
    dv_cells = []   # collect (formula, cell_ref) for bulk DataValidation

    for item in ROWS:
        row_type, section, question, client_hint, dv_formula, iirm_steps, owner = item

        if row_type == "SEC":
            ws.merge_cells(start_row=row_num, start_column=1, end_row=row_num, end_column=6)
            cell = ws.cell(row=row_num, column=1, value=section)
            cell.fill = fill(C["sec_hdr"])
            cell.font = bold_font("FFFFFF", 11)
            cell.alignment = wrap_align("left")
            cell.border = border
            ws.row_dimensions[row_num].height = 20
            row_num += 1
            continue

        # Row fill colour
        if row_type == "POL_HDR":
            row_fill = fill(C["pol_iirm"])
            txt_color = "FFFFFF"
        elif row_type == "INCEPT":
            row_fill = fill(C["inception"])
            txt_color = "000000"
        elif row_type == "INFO":
            row_fill = fill(C["info"])
            txt_color = "666666"
        elif row_type == "NOTIF":
            row_fill = fill(C["notif"])
            txt_color = "000000"
        elif owner == "IIRM":
            row_fill = fill(C["iirm"])
            txt_color = "000000"
        elif owner == "Both":
            row_fill = fill(C["both"])
            txt_color = "000000"
        else:
            row_fill = fill(C["client"])
            txt_color = "000000"

        # Client Input cell: show hint text only for free-text rows; leave blank for DV rows
        dv_hint_formulas = {YES_NO, YES_NO_NA, ON_OFF}
        if dv_formula and (client_hint == dv_formula or client_hint in dv_hint_formulas or (client_hint and client_hint.startswith('"'))):
            client_display = ""
        else:
            client_display = client_hint or ""

        values = [section, question, client_display, iirm_steps, owner, "Pending"]

        for col, val in enumerate(values, 1):
            cell = ws.cell(row=row_num, column=col, value=val if val else "")
            cell.fill = row_fill
            cell.font = Font(color=txt_color, size=10, bold=(col == 2 and row_type == "POL_HDR"))
            cell.alignment = wrap_align()
            cell.border = border

        # Data validation for Client Input (col C)
        if dv_formula:
            dv_cells.append((dv_formula, f"C{row_num}"))

        # Data validation for Status (col F)
        dv_cells.append((STATUS, f"F{row_num}"))

        ws.row_dimensions[row_num].height = 30 if len(question) > 80 else 22
        row_num += 1

    # ── Apply data validations ────────────────────────────────────────────────────
    dv_groups = defaultdict(list)
    for formula, cell_ref in dv_cells:
        dv_groups[formula].append(cell_ref)

    for formula, refs in dv_groups.items():
        d = DataValidation(type="list", formula1=formula, allow_blank=True)
        d.showErrorMessage = False
        ws.add_data_validation(d)
        for ref in refs:
            d.add(ref)

    # ── Save ──────────────────────────────────────────────────────────────────────
    out = os.path.join(os.path.dirname(__file__), "IBP-Setup-Questionnaire.xlsx")
    wb.save(out)
    print(f"Saved: {out}")


# ═════════════════════════════════════════════════════════════════════════════

COMMANDS = {
    "form": cmd_form,
    "golive-xlsx": cmd_golive_xlsx,
    "questionnaire-xlsx": cmd_questionnaire_xlsx,
}


def cli(argv=None):
    import argparse
    p = argparse.ArgumentParser(
        prog="generate_ibp_docs.py",
        description="Generate IBP client-facing documents from their sources.")
    p.add_argument("command", nargs="?", default="form", choices=sorted(COMMANDS),
                   help="which artifact to generate (default: form)")
    args = p.parse_args(argv)
    COMMANDS[args.command]()


if __name__ == "__main__":
    cli()
