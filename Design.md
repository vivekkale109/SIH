# Design.md

**Purpose:** The single UI/UX and design-system reference for the product. Consistent with `PRD.md` (features) and implemented per `Architecture.md`/`Phases.md`.

**Design direction:** Professional, secure, government/enterprise-grade, modern, clean, trustworthy.

**Explicitly avoid:** cyberpunk styling, gaming-style interfaces, excessive animation, visual clutter, fake "hacker" aesthetics (glitch effects, neon terminal themes, etc.). This is a serious tool for handling sensitive legal/investigative material — it should read as calm, precise, and dependable.

**Theme:** Dark-first (recommended default), with a light theme as a supported alternative using the same tokens.

---

## 1. Color System

Dark-first neutral palette with restrained, purposeful accent and semantic colors. Values below are a recommended starting palette (implementation may fine-tune exact hex values, but must preserve the semantic roles and contrast intent).

| Token | Dark theme | Light theme | Usage |
|---|---|---|---|
| `--bg-base` | `#0B0F14` | `#F7F8FA` | App background |
| `--bg-surface` | `#131922` | `#FFFFFF` | Cards, panels |
| `--bg-surface-raised` | `#1B222D` | `#FFFFFF` (with shadow) | Modals, dropdowns |
| `--border-default` | `#2A3340` | `#E2E5E9` | Dividers, card borders |
| `--text-primary` | `#EAEEF2` | `#12161C` | Primary text |
| `--text-secondary` | `#9AA5B1` | `#5B6472` | Secondary/muted text |
| `--accent-primary` | `#3B82F6` (blue) | `#2563EB` | Primary actions, links |
| `--accent-primary-hover` | `#5A96F7` | `#1D4ED8` | Hover state |
| `--success` | `#22C55E` | `#16A34A` | Success states, verified/match |
| `--warning` | `#F59E0B` | `#D97706` | Warnings, pending, low-confidence OCR |
| `--error` | `#EF4444` | `#DC2626` | Errors, mismatch, denial |
| `--info` | `#38BDF8` | `#0284C7` | Informational states |
| `--neutral` | `#6B7280` | `#6B7280` | Neutral/default badges |

**Rule:** Semantic colors (success/warning/error/info) are used **only** for their semantic meaning — never decoratively. A red badge always means error/mismatch/denied; never used for a merely "important" label without an actual failure/negative condition.

## 2. Typography

- **Font family:** A clean, highly legible sans-serif (e.g., Inter or system UI stack) for all UI text. A monospace font (e.g., JetBrains Mono / system monospace) is used **only** for hashes, IDs, and code-like values.
- **Weights:** Regular (400) for body text, Medium (500) for labels/buttons, Semibold (600) for headings — avoid heavier weights to keep the interface calm.

## 3. Font Sizes

| Token | Size | Usage |
|---|---|---|
| `text-xs` | 12px | Metadata, timestamps, badges |
| `text-sm` | 14px | Secondary text, table cells |
| `text-base` | 16px | Body text, form inputs |
| `text-lg` | 18px | Card titles, section headers |
| `text-xl` | 22px | Page titles |
| `text-2xl` | 28px | Dashboard headline metrics only |

## 4. Spacing

4px base unit scale: `4, 8, 12, 16, 24, 32, 48, 64`. Use consistent `16px`/`24px` gutters for page padding and card padding; `8px`/`12px` for tight internal component spacing.

## 5. Border Radius

- Small controls (badges, inputs, buttons): `6px`.
- Cards/panels: `10px`.
- Modals: `12px`.
- Avoid fully rounded ("pill") shapes except for status badges and small tags — keeps the tone professional rather than playful.

## 6. Shadows

Minimal, subtle elevation only — no heavy glows or neon shadows:
- Card: `0 1px 2px rgba(0,0,0,0.24)`
- Modal/raised surface: `0 8px 24px rgba(0,0,0,0.32)`
No colored/glowing shadows.

## 7. Buttons

| Variant | Usage |
|---|---|
| Primary (`--accent-primary` fill) | Main action per screen (e.g., "Upload Document") |
| Secondary (outline) | Secondary actions (e.g., "Cancel") |
| Destructive (`--error` fill/outline) | Revoke, archive, remove member — always paired with a confirmation step |
| Ghost/text | Low-emphasis actions (e.g., "View details") |

Buttons always show a loading state (spinner + disabled) during async actions to avoid duplicate submissions (e.g., duplicate uploads).

## 8. Inputs

- Clear label above every input (no placeholder-only labels).
- Visible focus ring using `--accent-primary`.
- Inline validation errors shown directly below the field in `--error` text, not only as a toast.
- File input shows selected filename, size, and a clear "remove/replace" affordance before submission.

## 9. Tables

- Used for document lists, audit logs, user/role management, search results.
- Sticky header row; sortable columns where meaningful (date, name, status).
- Row-level actions in a trailing "actions" column (icon buttons with tooltips), not inline destructive buttons without confirmation.
- Zebra striping avoided in favor of subtle row-divider borders (`--border-default`) for a cleaner look.

## 10. Cards

- Used for dashboard summaries, case cards, document preview cards.
- Consistent structure: title, metadata row (small/secondary text), status badge, primary action.

## 11. Modals

- Used for: confirmations, share dialogs, "add member," "assign role."
- Always dismissible via explicit Cancel and an "X," never only by clicking outside for destructive-action modals.
- Focus-trapped and keyboard-navigable (Escape closes, Enter confirms only on non-destructive modals).

## 12. Alerts

- Inline banner alerts (not just toasts) for important state, e.g., "This document failed OCR processing," using semantic colors (§1).
- Toasts used for transient confirmations (e.g., "Share link copied").

## 13. Status Badges

| Badge | Color | Meaning |
|---|---|---|
| Processing | `--info` | OCR/AI job running |
| Complete / Verified / Match | `--success` | Positive terminal state |
| Pending Review | `--warning` | Awaiting supervisor review |
| Failed / Mismatch / Denied | `--error` | Negative terminal state |
| Archived / Superseded | `--neutral` | Inactive/historical state |

## 14. Navigation

Top bar: product name/logo (text-based, no cyberpunk iconography), global search, notifications bell, user menu (profile, role indicator, logout).

## 15. Sidebar

Left sidebar with primary sections: Dashboard, Cases, Search, Timeline (per active case), Audit (Auditor/Admin only), Admin (Super Admin only). Collapsible on smaller viewports.

## 16. Dashboard

- Summary cards: active cases, documents pending review, recent shares, recent audit highlights (role-appropriate — an investigator sees their cases; an auditor sees system-wide audit summaries).
- Recent activity feed (permission-filtered).
- Quick actions: "New Case," "Upload Document" (contextual to permissions).

## 17. Case Page

- Header: case number, title, status badge, members.
- Tabs: Documents, Timeline, Evidence, Members, (Audit excerpt for supervisors/auditors).
- Document list table (§9) scoped to the case.

## 18. Document Page

- Header: title, type, current version badge, OCR status badge.
- Primary panel: document preview (PDF/image viewer) or a safe non-executing preview for other types.
- Side panel: metadata, version history (§ Version UX below), integrity verification action + result, AI Assist panel (clearly labeled advisory-only), share action.
- Tabs or sections: Versions, AI Results, Audit (excerpt for this document, if user has audit visibility).

## 19. Evidence Page

- List of `Evidence` records for a case with type, description, collection date, and links to related documents — same table pattern as §9, same access rules as documents.

## 20. Search Page

- Prominent search bar (global vs. case-scoped toggle).
- Filters: document type, date range, case (if global).
- Results as a list of cards/rows with a short highlighted snippet of matching text and a relevance-sorted order; results only ever include documents the user is authorized to see.

## 21. Timeline

- Vertical chronological timeline per case; each event shows time, description, creator, and linked document/evidence chips (chips route through normal authorization when clicked).
- "Add Event" available to authorized roles inline at the top of the timeline.

## 22. Audit Page

- Filter bar: user, action type, resource type, date range.
- Table (§9) of audit events: timestamp, actor, action, resource, outcome badge.
- Read-only for all roles that can access it — no edit/delete affordances exist anywhere in this screen.

## 23. User Management

- Admin-only table of users with role badges, case-membership counts, and account status.
- Actions: assign/revoke role, deactivate account (soft, not hard-delete) — all require confirmation and are audit-logged.

## 24. Settings

- Profile settings (name, password change).
- Notification preferences.
- (Admin) system-level settings, kept minimal for MVP.

## 25. Login Page

- Minimal, focused: email, password, primary "Log In" button.
- No decorative clutter; a short, plain-text note that this is a prototype using synthetic data (judge-facing transparency, consistent with `PRD.md` non-goals) may be shown on the login/about screen.

## 26. Responsive Design

- Desktop-first (primary usage context: investigators/officers at a workstation), but core flows (login, view document, view case, search) must remain usable at tablet width (≥768px). Full data-table-heavy admin/audit screens may be desktop-optimized with horizontal scroll on narrower viewports rather than fully redesigned for mobile in the MVP.

## 27. Accessibility

- Minimum WCAG AA contrast for text against backgrounds in both themes.
- All interactive elements keyboard-navigable; visible focus states.
- Icons paired with text labels or `aria-label`s, not icon-only for critical actions.
- Status conveyed by color **plus** text/icon (never color alone), important given semantic badges (§13).

## 28. Empty States

- Every list/table has a designed empty state with a short explanation and, where applicable, a primary action (e.g., empty document list → "No documents yet — Upload the first document").
- Empty states are calm and informative, not blank/broken-looking.

## 29. Loading States

- Skeleton loaders for lists/tables and document previews (not spinner-only for content-heavy areas).
- Inline spinners for button-level async actions.
- Long-running background work (OCR, AI) shows a persistent status badge rather than a blocking loading screen — the user can navigate away and come back.

## 30. Error States

- Inline, specific error messages tied to the failing action (e.g., "Upload failed: file type not supported") — never a raw technical error or stack trace (per `Rules.md` §12).
- Full-page error state (e.g., "Something went wrong") includes a correlation/reference ID for support, and a way back to a safe page (dashboard).
- `403`/`404` states are distinct and clear: "You don't have access to this case" vs. "This case doesn't exist," decided consistently per the authorization rules in `Architecture.md` §8 / `Rules.md` §10.

---

## Key UX Flows

### Uploading a Document
1. From a case page, user clicks "Upload Document" (primary button).
2. Modal/panel: file picker + required metadata (type, title, tags, description).
3. On submit: button shows loading state; on success, toast confirmation + new row appears in the document table with status "Processing" (OCR queued) or "Ready" if not applicable.
4. Errors (bad file type, too large, network failure) are shown inline, specific, and non-technical.

### Viewing a Document
1. Click a document row → document detail page.
2. Preview loads with a skeleton state first.
3. Metadata, current version badge, and OCR/AI status badges are visible immediately without extra clicks.

### Verifying Integrity
1. On the document detail page, user clicks "Verify Integrity."
2. Button shows a brief loading state (server recomputes hash).
3. Result banner appears: green "Match" with digest + original upload timestamp/uploader, or red "Mismatch" with the same context.
4. A small, permanent info note beneath the result restates the exact scope-limiting language from `Rules.md` §17 (does not prove authenticity/admissibility) — this note is never hidden or omitted.

### Viewing Document Versions
1. "Versions" section/tab on the document page lists all versions newest-first, each with uploader, timestamp, hash (monospace, truncated with a "copy full hash" affordance), and a "Current"/"Superseded" badge.
2. Clicking any version opens that specific version's preview and allows integrity verification for that version specifically.

### Searching
1. User types in the search bar (global or case-scoped).
2. Results stream in with a loading skeleton; each result shows title, case (if global), snippet with highlighted match, type badge, and last-updated date.
3. Empty results show a clear "No results" state distinct from a loading or error state.

### OCR Processing
1. Immediately after upload of an eligible file, the document shows an "OCR: Processing" badge.
2. Badge updates (via polling or refresh) to "OCR: Complete" — clicking it reveals extracted text and, if below a confidence threshold, a visible "Low confidence — verify manually" warning (`--warning`).
3. "OCR: Failed" is shown plainly with an option to retry (if implemented) rather than a silent dead end.

### Permission Denial
1. Attempting to access an unauthorized case/document (including via direct URL) shows a clear, calm `403`-style page: "You don't have access to this [case/document]. Contact your supervisor if you believe this is an error."
2. No partial data, metadata, or hints about the resource's contents are shown.

### Sharing
1. From a document, user clicks "Share."
2. Modal: choose internal user/role or "generate external link," set scope (view-only/download), set expiry.
3. On confirm: link/grant is created; UI shows the link (with copy button) and a summary of scope/expiry.
4. "Active Shares" list on the document shows all current grants with a "Revoke" action (confirmation required); revoked/expired shares are visually distinguished (neutral/error badge) rather than removed from history.

### Audit History
1. From an audit-accessible context (document, case, or the global Audit page), user can view a filtered, chronological list of relevant events.
2. Each entry is plain-language where possible (e.g., "Uploaded by R. Sharma — 28 Aug 2026, 10:42") with a technical details expander (raw action type, resource ID) for power users/auditors.

---

## Security-Sensitive Action UX Pattern (applies system-wide)

Every security-sensitive action (revoke share, remove case member, change role, archive/deactivate, delete-equivalent actions) follows the same pattern:
1. Trigger via a clearly labeled (not icon-only) action.
2. Confirmation modal stating exactly what will happen and to whom/what.
3. Explicit confirm button using the Destructive button variant (§7), never the Primary accent color, to visually distinguish "risky" from "routine."
4. Success/failure feedback via toast + updated UI state (badge/list update) reflecting the new state immediately.
5. The action is audit-logged and visible in the relevant Audit view.
