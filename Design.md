# Design.md

**Purpose:** The single UI/UX and design-system reference for the product. Consistent with `PRD.md` (features) and implemented per `Architecture.md`/`Phases.md`.

**Design direction:** Professional, secure, government/enterprise-grade, modern, clean, trustworthy — expressed through a **light, warm, approachable interface** rather than a cold/clinical one. Think "calm SaaS productivity tool," not "surveillance dashboard." The visual language uses soft mint/green accents, generous white space, rounded cards, pill-shaped tags and buttons, and avatar-driven lists to make a serious tool feel approachable for daily use by investigators and officers — without ever feeling casual about the sensitivity of the content.

**Explicitly avoid:** cyberpunk styling, gaming-style interfaces, excessive animation, visual clutter, fake "hacker" aesthetics (glitch effects, neon terminal themes, dark-only "ops room" styling). Also avoid tipping too far into "consumer app" playfulness — no emoji, no illustrations of people beyond avatar photos, no marketing-style copy. The tone stays warm but restrained.

**Theme:** **Light-first** (primary/default), with a dark theme as a supported alternative using the same tokens, for low-light/late-shift use. This is a change from earlier revisions of this document, which specified dark-first — updated per design direction review.

---

## 1. Color System

Soft, neutral light palette with a single green accent family (avoids the multi-accent look of a marketing site) plus standard semantic colors. Values below are a recommended starting palette; implementation may fine-tune exact hex values but must preserve the semantic roles and contrast intent.

| Token | Light theme (default) | Dark theme (alt) | Usage |
|---|---|---|---|
| `--bg-page` | `#E9F5EA` (soft mint) | `#0B0F14` | Outer app background (visible as a frame/margin around the main panel, as in the reference layout) |
| `--bg-surface` | `#FFFFFF` | `#131922` | Main content panels, cards |
| `--bg-surface-muted` | `#F4F6F8` | `#1B222D` | Secondary panels, input backgrounds, hover rows |
| `--border-default` | `#E7EAEE` | `#2A3340` | Dividers, card borders |
| `--text-primary` | `#151A2D` (deep navy-black) | `#EAEEF2` | Headings, primary text |
| `--text-secondary` | `#8A93A3` | `#9AA5B1` | Muted/secondary text, timestamps |
| `--accent-primary` | `#3FBF60` (brand green) | `#3FBF60` | Primary buttons, active nav state, key highlights |
| `--accent-primary-hover` | `#34A652` | `#54D073` | Hover state |
| `--accent-primary-soft` | `#EAF8ED` | `#173321` | Selected pill/tag backgrounds, active-tab underline area |
| `--success` | `#22C55E` | `#22C55E` | Verified / match / positive states |
| `--warning` | `#F5A623` | `#F59E0B` | Pending review, low-confidence OCR, star/flag |
| `--error` | `#EF4444` | `#EF4444` | Mismatch, denied, destructive actions |
| `--info` | `#3B82F6` | `#38BDF8` | Informational badges, links |
| `--neutral` | `#8A93A3` | `#6B7280` | Default/inactive badges |

**Rule:** `--accent-primary` (green) is reserved for primary actions and active/selected state — it is **not** reused as a generic "success" color in contexts where a real positive/negative outcome (like integrity verification) is being shown; that always uses `--success`/`--error` specifically, so users never confuse "this is the brand color" with "this passed a security check."

**Rule:** Semantic colors are used only for their semantic meaning, consistent with prior guidance — never decoratively.

## 2. Typography

- **Font family:** A clean, rounded-but-professional sans-serif (e.g., a font in the Inter / Manrope / "Plus Jakarta Sans" family) for all UI text — slightly warmer than a pure grotesque, matching the friendly-but-serious tone. A monospace font (e.g., JetBrains Mono) is used **only** for hashes, IDs, and code-like values.
- **Weights:** Regular (400) for body text, Semibold (600) for headings and names (e.g., sender/user names in lists), Medium (500) for labels/buttons/pills.
- Headings (like a page's "Good morning" / page-title equivalent) are notably large and bold relative to body text, establishing a clear hierarchy — see §3.

## 3. Font Sizes

| Token | Size | Usage |
|---|---|---|
| `text-xs` | 12px | Metadata, timestamps, pill labels |
| `text-sm` | 14px | Secondary text, table cells, list subtext |
| `text-base` | 16px | Body text, form inputs, list primary names |
| `text-lg` | 20px | Card titles, section headers (e.g., "Subjects", "Versions") |
| `text-xl` | 26px | Panel headlines (e.g., a document/message subject line) |
| `text-2xl` | 34px | Page greeting / hero heading (e.g., dashboard welcome heading) |

## 4. Spacing

4px base unit scale: `4, 8, 12, 16, 24, 32, 48, 64`. Generous padding is a signature of this style: page/panel padding of `32–40px`, card padding of `24px`, list-row vertical padding of `16–20px` with a full-width `1px` divider (`--border-default`) between rows rather than boxed cards for list items.

## 5. Border Radius

A rounder system than a typical enterprise console, to match the friendly tone:
- Small controls (pills, tags, small badges): **fully rounded (999px / pill shape)** — this is a deliberate signature of the style (status pills, filter tabs, subject tags all use full pill shape).
- Buttons: `12px`.
- Input fields / search bar: `12px`, or pill (`999px`) for a prominent global search bar specifically (as in the reference).
- Cards / panels: `16px`.
- Avatars: fully circular, often with a colored ring to indicate state (e.g., green ring = online/active, or used as a lightweight "selected/linked" indicator — used sparingly and only with real meaning, never decoratively).

## 6. Shadows

Very soft, barely-there elevation — the light background does most of the separation work, so shadows stay minimal:
- Card: `0 2px 8px rgba(16, 24, 40, 0.06)`
- Modal/raised surface: `0 12px 32px rgba(16, 24, 40, 0.14)`
No colored or glowing shadows, no heavy drop shadows.

## 7. Buttons

| Variant | Style | Usage |
|---|---|---|
| Primary | Solid `--accent-primary` fill, white text, `12px` radius | Main action per screen (e.g., "Upload Document," "Compose"-equivalent) |
| Secondary | White/`--bg-surface` fill with `--border-default` outline, dark text | Secondary actions (e.g., "Schedule a call"-equivalent — "Add Event," "Invite Member") |
| Destructive | Solid `--error` fill or `--error` outline | Revoke, remove member, archive — always paired with a confirmation step |
| Ghost/text | No fill, `--text-secondary` → `--text-primary` on hover | Low-emphasis actions |

Icon + label combinations (icon on the left, label on the right, as in the reference "+ Compose" / camera "Schedule a call") are the default pattern for primary/secondary buttons — icon-only buttons are reserved for dense toolbar contexts (e.g., row actions in a table) and always carry a tooltip/`aria-label`.

## 8. Inputs

- Search input: pill-shaped, muted background (`--bg-surface-muted`), search icon trailing or leading, placeholder text in `--text-secondary` — used prominently in the top bar (global search) per the reference layout.
- Form inputs: `12px` radius, `--border-default` border, clear label above (not placeholder-only), visible green focus ring (`--accent-primary`).
- Inline validation errors shown directly below the field in `--error` text.
- File input shows selected filename, size, and a clear remove/replace affordance before submission.

## 9. Tables

- Used for document lists, audit logs, user/role management.
- Prefer the **row-list pattern** shown in the reference (avatar + name/title + metadata + trailing status/action) over dense grid tables wherever the data is naturally record-like (documents, cases, audit events) — full data-grid tables remain appropriate for the Admin/Audit screens where scanning many columns matters.
- Sticky header row for true tables; sortable columns where meaningful.
- Row-level actions in a trailing position (star/flag icon, status pill, overflow menu) — mirroring the reference's trailing "2 new" pill / star icon pattern.

## 10. Cards

- White (`--bg-surface`) cards with `16px` radius sitting on the mint `--bg-page` background, or nested one level as muted (`--bg-surface-muted`) panels within a white card — this two-tone layering (mint page → white panel → muted sub-panel) is the core structural pattern of the whole UI, mirroring the reference's page background vs. panel vs. list-row treatment.
- Card anatomy: leading avatar/icon, title (semibold), metadata row (`text-secondary`, `text-sm`), trailing status pill or action.

## 11. Modals

- Rounded (`16–20px`), soft shadow, white surface.
- Always dismissible via explicit Cancel and an "X"; destructive-action modals are never dismissible by outside-click alone.
- Focus-trapped and keyboard-navigable.

## 12. Alerts

- Inline banner alerts for important state (e.g., OCR failure), using semantic colors, with the same soft/rounded (`12px`) treatment as the rest of the system — no harsh, square, high-contrast alert boxes.
- Toasts for transient confirmations, pill-shaped, appearing top-right.

## 13. Status Badges (Pills)

Matches the reference's pill-tag pattern exactly — this is a signature element:

| Badge | Style | Meaning |
|---|---|---|
| Processing | `--info` text on `--info`-tinted pill | OCR/AI job running |
| Complete / Verified / Match | `--success` text on light-green-tinted pill | Positive terminal state |
| Pending Review | `--warning` text on light-amber-tinted pill | Awaiting supervisor review |
| Failed / Mismatch / Denied | `--error` text on light-red-tinted pill | Negative terminal state |
| Archived / Superseded | `--neutral` text on light-gray-tinted pill | Inactive/historical state |
| "N new" counters | `--success` text on `--accent-primary-soft` pill | Unread/new-item counts on a list row, styled exactly like the reference's green "2 new" / "5 new" pills |

Selected filter/tab pills (e.g., an active "Subjects" tag, or the active case-document filter) use a filled `--text-primary`-on-`--bg-surface-muted` (or a dark-navy-on-white) pill to read as "selected," distinct from semantic status pills — matching the reference's dark "Subscription" pill vs. its outlined neighbors.

## 14. Navigation

Single top bar (no heavy top+side nav stacking): logo/wordmark at the left, a prominent pill-shaped global search bar centered/left-weighted, then a settings (gear) icon and a menu icon at the right — directly following the reference's header composition. A user/context panel (avatar, name, status) sits at the top of the right-hand detail pane rather than in a persistent global sidebar.

## 15. Sidebar

No persistent left icon-sidebar in this style; primary navigation lives in the **tab row** beneath the hero/header area of the main list panel (e.g., "Inbox / Starred / Drafted / Urgent / Spam / More" in the reference becomes, for this product, a tab row such as **"My Cases / Starred / Pending Review / Urgent / Archived / More"**), plus a secondary filter row beneath it (reference's "All / People / Companies" becomes **"All / Documents / Evidence / Timeline"** or similar, scoped to context). Admin/Audit/Search are reached via the top-bar menu icon rather than a permanent rail, keeping the main working view uncluttered.

## 16. Dashboard

Two-pane layout, directly modeled on the reference:
- **Left pane:** greeting header ("Good morning, {name}") with the user's avatar, two primary action buttons (e.g., "+ New Case" / "Upload Document"), then the tab row (§15) and a scannable list of cases/documents (avatar or type-icon, title, timestamp, trailing status pill/star).
- **Right pane:** context detail for whatever is selected in the left list — a case or document's summary, tags/subject pills, and the primary content (message-equivalent: latest activity, key metadata, and any attached file chip, matching the reference's attachment chip pattern for "David Milner's Badge 2022.png").
- This two-pane pattern is the default for **Cases**, **Documents**, and **Search Results** screens; Admin and Audit screens (data-dense, filter-heavy) use the classic full-width table pattern instead (§9) since a two-pane layout doesn't fit their scanning needs.

## 17. Case Page

- Adopts the two-pane pattern (§16): left = list of the case's documents/timeline items with tab row (Documents / Timeline / Evidence / Members); right = detail of the selected item.
- Case header (title, case number, status pill, member avatars stacked with slight overlap) sits atop the right pane, echoing the reference's contact-header block ("Max Skylar / Available").

## 18. Document Page

- When reached from the two-pane case view, the document renders in the right pane; when opened directly (e.g., from search or a share link), it renders as a full-width page using the same visual language (white panel on mint background).
- Header: subject-style title, type + OCR-status + version pills (matching the reference's "Subscription / Valuable Customer / Welcome" tag row — here used for document type/status tags).
- Body: document preview/content, with the integrity verification action, version history, AI Assist panel, and share action as clearly labeled sections below — attachments/related files shown as a chip (icon + filename), exactly matching the reference's attachment chip.

## 19. Evidence Page

Same list pattern as §9/§16 — evidence items as rows with a type icon, description, collection date, and linked-document chip.

## 20. Search Page

- The header search bar (§14) is the primary entry point; a dedicated search page shows results in the left-pane list pattern with the right pane previewing the selected result, keeping the two-pane consistency across the product.
- Filters (document type, date range, case) sit as a pill row beneath the search bar, styled like the reference's tag row.

## 21. Timeline

- Vertical chronological list within the two-pane case view; each event is a row (icon, description, timestamp, creator avatar) that opens its linked document(s) in the right pane on click, rather than navigating away.

## 22. Audit Page

- Departs from the two-pane pattern intentionally: full-width filterable table (§9 data-grid variant), since auditors need to scan many rows/columns at once. Filter controls use the same pill styling as elsewhere for visual consistency.
- Strictly read-only, as in the prior revision of this document — no edit/delete affordances.

## 23. User Management

- Admin table of users, avatar + name + role pill + status pill, actions in a trailing overflow menu. Role/status changes always require the confirmation pattern in the closing section of this document.

## 24. Settings

- Reached via the top-bar gear icon (§14): profile, notification preferences, and (Admin) system settings, in a simple single-column form list on a white card over the mint background.

## 25. Login Page

- Centered white card (`16px` radius, soft shadow) on the mint `--bg-page` background; logo/wordmark, email + password fields, primary green button.
- A short, plain-text note that this is a prototype using synthetic data may appear beneath the form (judge-facing transparency, consistent with `PRD.md` non-goals).

## 26. Responsive Design

- Desktop-first (primary usage context: investigators/officers at a workstation). The two-pane pattern (§16) collapses to a single pane with a back affordance at tablet widths (≥768px) — selecting a list item pushes to the detail view rather than showing both panes side by side. Data-grid screens (Admin/Audit) remain desktop-optimized with horizontal scroll on narrower viewports.

## 27. Accessibility

- Minimum WCAG AA contrast for text against both the white panels and the mint page background — the mint background must be tested carefully since light-on-light combinations reduce contrast margins compared to a dark theme.
- All interactive elements (including pill tabs/filters) keyboard-navigable with a visible focus state.
- Status conveyed by color **plus** text/icon, never color alone — important given the heavy use of pill badges.
- Avatar color-rings (§5) used as state indicators must always be paired with a text/tooltip equivalent, not rely on ring color alone.

## 28. Empty States

- Friendly but restrained: a simple icon, short explanation, and a primary action button in the established style — no illustrations or playful copy, consistent with the "warm but not casual" tone.

## 29. Loading States

- Skeleton loaders (rounded, matching component radii) for lists and detail panes.
- Inline spinners for button-level async actions.
- Persistent status pills (§13) for background work (OCR/AI) rather than blocking loaders.

## 30. Error States

- Inline, specific error messages tied to the failing action — never a raw technical error or stack trace (per `Rules.md` §12).
- Full-page error state includes a correlation/reference ID and a clear way back to the dashboard, styled as a centered white card on the mint background, consistent with the login page treatment.
- `403`/`404` states are distinct and clearly worded, per the authorization rules in `Architecture.md` §8 / `Rules.md` §10.

---

## Key UX Flows

### Uploading a Document
1. From the dashboard or case left-pane, user clicks the primary "+ Upload Document" button (green pill/rounded button, top of the left pane — mirroring the reference's "+ Compose" placement).
2. A modal (or the right pane, for in-context upload) collects the file + required metadata (type, title, tags as pills, description).
3. On submit: button shows a loading state; on success, the new document appears at the top of the left-pane list with a "Processing" pill, and the right pane auto-selects it to show live status.

### Viewing a Document
1. Selecting a document in the left-pane list loads it into the right pane (or navigates to the full document page if opened standalone).
2. The right pane header mirrors the reference's contact-header block: uploader avatar, name, and a status line (e.g., "Uploaded · Verified") in place of "Available."
3. Type/status tags render as a pill row directly beneath the header, exactly as the reference's "Subscription / Valuable Customer / Welcome" row.

### Verifying Integrity
1. From the document detail pane, user clicks "Verify Integrity" (secondary button style).
2. Result appears as an inline banner using `--success`/`--error`, plus the digest and timestamp — with the same permanent, non-removable scope-limiting note required by `Rules.md` §17 ("confirms byte-level integrity only, not authenticity or admissibility") shown directly beneath the result, in `text-sm`/`--text-secondary`.

### Viewing Document Versions
1. A "Versions" section in the right pane lists versions newest-first as rows (avatar of uploader, timestamp, hash in monospace with a copy affordance, and a Current/Superseded pill).
2. Selecting a version updates the preview above it without leaving the pane.

### Searching
1. User types into the top-bar pill search field.
2. Results populate the left-pane list (avatar/type-icon, title, snippet, trailing relevance/date), with the top result auto-previewed in the right pane — consistent with the two-pane pattern used everywhere else.

### OCR Processing
1. Immediately after upload, the document's list row and detail header show a `--info`-tinted "Processing" pill.
2. On completion, the pill updates in place to `--success` "Complete" (or `--warning` "Complete — Low Confidence" where applicable) without requiring navigation away from the pane.

### Permission Denial
1. Selecting an unauthorized case/document in a list (should it ever be reachable, e.g., via a stale link) shows a calm, centered message in the right pane / full page: "You don't have access to this [case/document]," styled consistently with the empty-state pattern (§28), not as a jarring red error page.

### Sharing
1. From the document detail pane, "Share" opens a modal: recipient/scope/expiry fields, matching the input styles in §8.
2. On confirm, an "Active Shares" list appears as rows (recipient/link icon, scope pill, expiry, Revoke action) beneath the main document content.

### Audit History
1. From a document or case, an "Audit" section/tab shows a condensed, plain-language row list (avatar, actor name, action, timestamp) with a "View full audit log" link into the full Audit table page (§22) for deeper filtering.

---

## Security-Sensitive Action UX Pattern (applies system-wide)

Unchanged in substance from prior guidance, restyled to match this system:
1. Trigger via a clearly labeled (not icon-only) button using the Destructive style (§7).
2. Confirmation modal (§11) stating exactly what will happen and to whom/what.
3. Explicit confirm button in `--error`, visually distinct from the green Primary action color so "risky" never looks like "routine."
4. Success/failure feedback via toast + immediate in-place pill/status update — no full-page reload required.
5. The action is audit-logged and visible in the relevant Audit view (§22).