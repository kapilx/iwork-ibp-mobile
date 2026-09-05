# Rich Media & In-App Preview — Enhancement Plan

**Module:** IIRM-768_Knowledge-Central | **Apps:** iWork (Knowledge Central + iLearn) | **Date:** 2026-06-22 | **Status:** Draft plan (pre-build) | **Relates to:** [Knowledge-Central-PRD.md](Knowledge-Central-PRD.md)

---

## Why this exists

The client wants Training Materials (and, per the decision below, the wider library) to accept **any reasonable document, plus video and audio**, and to **preview/play everything in-app** instead of only downloading. Today the system offers "Video" and "Audio" as document *types* in the drawer, but the file picker's `accept` list is hardcoded to documents and images only and there is no server-side type/size handling tuned for media. This plan defines the **allowed-types contract** and a **single-release build** (no phasing) to get there. It supersedes the as-built behavior described in the PRD; the PRD stays the record of what exists, this plan is the record of what we are changing.

### Locked decisions (from product)

| Decision | Choice | Consequence |
|---|---|---|
| Surface | **Both iLearn + Knowledge Central** | One shared allow-list; the change lands in the shared `AddEditDocumentDrawer` and `knowledge` service — no per-module branching needed |
| Type policy | **Bounded allow-list** | Common doc/image/video/audio formats allowed; executables and script-capable files blocked. "Feels like any type" to users, but safe |
| Max file size | **≤ 250 MB** | Keeps a single-request upload (no presigned/multipart rebuild), but forces a move off in-memory buffering and a raised infra body limit |
| Consumption | **Inline preview & playback for all types** | New streaming endpoint + in-app viewers; introduces a conflict with the current password-protected-download feature (see [Decisions for TL & Security](#decisions-for-tech-lead--security)) |

---

## Allowed types (the target contract)

Validation is **layered** — a file must pass all three: (1) extension on the allow-list, (2) declared MIME consistent with the extension, (3) magic-byte sniff consistent with both. Extension alone is spoofable, so it is never the sole gate. Anything not on the allow-list — or anything on the blocklist regardless of its declared MIME — is rejected. Hard size ceiling: **250 MB**.

### Documents

| Group | Extensions | MIME types | In-app preview |
|---|---|---|---|
| PDF | `.pdf` | `application/pdf` | Yes — pdf.js |
| Word | `.doc`, `.docx` | `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Yes — convert-to-PDF |
| Excel | `.xls`, `.xlsx` | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Yes — convert-to-PDF |
| PowerPoint | `.ppt`, `.pptx` | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` | Yes — convert-to-PDF |
| Text / data | `.txt`, `.csv`, `.rtf` | `text/plain`, `text/csv`, `application/rtf` | Yes — text render |

### Images

| Extensions | MIME types | In-app preview |
|---|---|---|
| `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | Yes — `<img>` |

> `.svg` is **excluded** — it can carry inline scripts (stored-XSS). If vector images are truly needed, allow only after server-side sanitization.

### Video

| Extensions | MIME types | In-app playback |
|---|---|---|
| `.mp4`, `.webm`, `.mov`, `.m4v`, `.ogv` | `video/mp4`, `video/webm`, `video/quicktime`, `video/x-m4v`, `video/ogg` | Yes — HTML5 `<video>` + Range |

> **MP4 (H.264 + AAC) is the safe default** for browser playback. `.mov`/`.m4v` usually play, but some codecs won't render in-browser — see the transcoding question. `.avi`/`.mkv` are intentionally **not** allowed (poor/no native browser support).

### Audio

| Extensions | MIME types | In-app playback |
|---|---|---|
| `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg` | `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/aac`, `audio/ogg` | Yes — HTML5 `<audio>` |

### Blocklist (always rejected)

Regardless of declared MIME or chosen document type:

- **Executables / installers:** `.exe`, `.msi`, `.com`, `.dll`, `.bat`, `.cmd`, `.sh`, `.app`, `.jar`, `.ps1`, `.vbs`
- **Active / web content:** `.html`, `.htm`, `.xhtml`, `.js`, `.mjs`, `.svg`, `.php`
- **Archives** (`.zip`, `.rar`, `.7z`): **excluded from this release's allow-list.** Permit later only behind antivirus scanning (the codebase already has a password-protected-ZIP check, but that is not malware scanning).

---

## Gaps to close (mapped to current code)

These are the concrete deltas between the allow-list above and what the code does today. Each is a work item, grouped by layer.

**Frontend**
1. `accept` is hardcoded and static at [AddEditDocumentDrawer.tsx:165](../../apps/ui/iwork/src/app/pages/KnowledgeCentral/AddEditDocumentDrawer.tsx#L165) (`.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png`). → Make it **dynamic by the selected document-type family** (Document → docs, Image → images, Video → video, Audio → audio) and broadened to the full allow-list.
2. No client-side size check or upload-progress UI. → Add a ≤250 MB pre-check with a clear message, and a progress indicator (250 MB uploads are slow).

**Backend (knowledge-service)**
3. No multer size limit — the `FileInterceptor("file")` at the controller sets no `limits`; multer's default is **unlimited** (it is *not* 50 MB). → Set `limits.fileSize = 250 MB`.
4. Upload reads the whole file into memory (`file.buffer`) before writing to S3/local. → At 250 MB this risks OOM under concurrency; switch to **disk storage / streamed write** (multer `diskStorage` or stream to S3).
5. No server-side type allow-list (DTOs do `@IsString` only; no `fileFilter`). → Add the **layered validation** (extension + MIME + magic-byte sniff) and the blocklist.
6. The download endpoint serves the whole file as `Content-Disposition: attachment` with PDF password-protection applied → it **cannot stream or preview**. → Add a separate **inline streaming endpoint** (Workstream C).
7. Store the file's **MIME type** (currently derived ad hoc) so the streaming endpoint can set the correct `Content-Type` for the player.

**Infra (outside this repo)**
8. The proxy/gateway body-size cap is the **most likely current production failure** for media (nginx default `client_max_body_size` is 1 MB). → Raise to **≥ 256 MB** with headroom, and confirm upload **timeouts** tolerate slow large uploads. The app's `express.json/urlencoded` 20 MB limit at [common-bootstrap.ts:73-74](../../apps/services/service-lib/src/lib/common-bootstrap.ts#L73) does **not** gate multipart, but align it if any base64 paths exist.

**Already fine (no work)**
- The password-protected-upload check correctly **skips** non-Office/PDF/ZIP files, so video/audio pass it — not a blocker.
- No backend extension allow-list currently *rejects* media (the gap is the missing *positive* validation, not an existing block).

---

## Release scope — single release, no phasing

The whole capability ships as **one release**: upload of the expanded types, the 250 MB ceiling, server-side validation, and **in-app preview/playback for every allowed type including Office** — all together. The items below are **parallel workstreams**, not stages; the release is "done" only when all of them are. (Release train/version may differ, but the scope is atomic — nothing is split across releases.)

> The release **cannot ship** until the two hard blockers are resolved: the password-protection-vs-preview reconciliation and the Office-preview conversion approach (both in [Decisions for TL & Security](#decisions-for-tech-lead--security)). They gate the release, not a later phase.

**Workstream A — Upload & storage**
- Multer `limits.fileSize = 250 MB`; switch off in-memory buffering to disk/stream storage (OOM-safe); persist the file's MIME type.
- Layered validation (extension + MIME + magic-byte sniff) and the blocklist enforced server-side.

**Workstream B — Frontend authoring**
- `accept` made dynamic by the selected document-type family and broadened to the full allow-list.
- Client-side ≤250 MB pre-check with a clear message; upload-progress indicator.

**Workstream C — Streaming/preview backend**
- New **`GET /knowledge/:documentId/stream`** — Range-request capable, `Content-Type` from stored MIME, `Content-Disposition: inline`, **no** PDF password-protection. Prefer **presigned S3 GET with Range** (offloads the app server, supports seeking); local storage gets a Range handler.

**Workstream D — In-app viewers (all types)**
- A preview modal/drawer that routes by type → `<video>` (seek controls), `<audio>`, `<img>`, **pdf.js** for PDF, text renderer for `.txt/.csv`.
- **Office (`.doc/.xls/.ppt` + x variants):** server-side **convert-to-PDF** (LibreOffice headless / Gotenberg) rendered through the same pdf.js viewer. A third-party viewer (Google/Office Online) is **not** acceptable — it ships the file off-platform.

**Workstream E — Infra**
- Raise the proxy/gateway `client_max_body_size` to **≥ 256 MB**; confirm upload **timeouts** tolerate slow large uploads. (This cap is the most likely current production failure for media.)

**Release done when:** any allowed document/video/audio up to 250 MB uploads end-to-end in production; oversized/blocklisted files are rejected with a clear message; and PDF, Office (via convert-to-PDF), image, text, video, and audio all preview/play in-app with seeking for media.

---

## PRD impact

This enhancement changes signed-off behavior, so it should be handled as a **Daksh change record** (large weight class → 2 approvals). Proposed PRD edits once approved:

- **BR-KC-004** flips from "frontend picker hint only, no backend validation" to a **validated layered allow-list** — becomes 🟢 Live on release.
- New requirements to add, all tagged 🔴 **Yet to start** until the release ships (they go live together, not incrementally):
  - `US-KC-020` / `BR-KC-025` / `AC-KC-032` — expanded bounded allow-list (documents, images, video, audio) with server-side layered validation + blocklist.
  - `US-KC-021` / `BR-KC-026` / `AC-KC-033` — 250 MB size ceiling enforced at frontend, app (multer), and infra.
  - `US-KC-022` / `BR-KC-027` / `AC-KC-034` — in-app preview/playback via a Range-capable inline streaming endpoint (video, audio, PDF, image, text).
  - `US-KC-023` / `BR-KC-028` / `AC-KC-035` — Office document preview in-app via server-side convert-to-PDF.
- **Out of scope** in the PRD ("no inline player / no in-browser viewer") gets removed — it is now in scope.

---

## Decisions for Tech Lead & Security

Flagged because each is a code/infra/security change that must go through review (not assumed here):

1. **Password-protection vs. inline preview (must resolve — release blocker).** Today downloads of sensitive docs are password-protected server-side. Inline preview defeats that — you can't password-protect a streamed `<video>` or an embedded PDF the same way. Reconcile: preview only for non-sensitive categories? Drop protection for media? Watermark instead? Since preview ships in the same release, this **gates the whole release** for protected content, not a later stage.
2. **Antivirus scanning.** Accepting arbitrary media/docs (even bounded) raises malware risk. Recommend AV scan on upload (e.g., ClamAV/managed scan) before the file is browsable — mandatory if the allow-list ever widens toward "any".
3. **Video transcoding.** Allow `.mov`/`.m4v` as-is (some won't play in-browser), or normalize uploads to MP4/H.264 server-side for guaranteed playback? Transcoding is a separate service/cost.
4. **Storage & delivery cost.** 250 MB files across a **global, un-scoped** library (PRD BR-KC-022) multiply storage and egress. Consider a CDN for streaming and revisit tenant scoping before media volume grows.
5. **Memory/concurrency.** Buffered 250 MB uploads will OOM under load — disk/stream storage is required, not optional.
6. **Upload method ceiling.** 250 MB works as a single buffered request with raised limits, but if the client later wants full-length training videos (>1 GB), this needs S3 multipart / presigned direct-to-S3 uploads — a larger rebuild. Confirm 250 MB is a real ceiling, not a placeholder.

---

## Open questions

1. Is 250 MB a firm ceiling, or will full-length training videos push past it (triggering the multipart/presigned rebuild)?
2. Office convert-to-PDF tooling — LibreOffice headless vs Gotenberg vs other; and **when** it runs — pre-converted on upload (faster first view, more storage) or converted on first preview (lazy)?
3. Does preview/playback require the same entitlement as download, or is preview open to all viewers?
4. Are archives (`.zip`) actually needed for training bundles? If so, AV scanning becomes mandatory.
5. Should the bounded allow-list be **configurable** (lookup/feature-flag) so adding a format later isn't a code change?
