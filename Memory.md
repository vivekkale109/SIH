# Memory.md

**Purpose:** Living AI handoff document. This file tracks the **actual, verified** development state of the project — not the plan (that's `Phases.md`) and not the spec (that's `PRD.md`/`Architecture.md`).

**Binding rule:** Never mark something complete unless it has actually been implemented **and** tested. If something is unknown, write `UNKNOWN` — never guess.

**Update cadence:** This file must be updated at the end of every phase (see `Phases.md`), and any time a significant decision, blocker, or bug is found.

---

## 1. Current Phase

**Phase 0 — Foundation** (not yet started)

## 2. Current Project Status

**Planning / Foundation.** Documentation set (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`) has been created. No application code has been written yet.

## 3. Implementation Status

**Not Started.**

## 4. Technology Decisions

| Decision | Value | Status |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS | Decided (per `Architecture.md`) |
| Backend | Node.js + TypeScript + NestJS, REST | Decided |
| ORM | Prisma | Decided |
| Database | PostgreSQL | Decided |
| Object storage | MinIO (S3-compatible) | Decided |
| OCR | Tesseract | Decided |
| Search (MVP) | PostgreSQL full-text search | Decided |
| Search (conditional future) | OpenSearch/vector search | Not decided — only if MVP search proves insufficient |
| Job queue | PostgreSQL-backed job table (MVP) vs. Redis+BullMQ (optional) | UNKNOWN — to be decided in Phase 8 |
| Deployment | Docker + Docker Compose + Nginx | Decided |

## 5. Architecture Decisions

- Modular monolith backend (NestJS, one module per domain) rather than microservices — chosen for hackathon-scope simplicity, per `Architecture.md` §1.
- All authorization enforced server-side, two-layer (role + resource-scope), per `Architecture.md` §8.
- Files stored under generated, non-guessable keys in private object storage, per `Architecture.md` §6.
- SHA-256 for MVP integrity verification, with strict, non-overselling language required everywhere (`Rules.md` §17).
- AI features are advisory-only, isolated to a separate `AIResult` table, never modifying original document content (`Rules.md` §16).

## 6. Completed Features

- [x] Documentation set created (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`)

_No application features are complete yet._

- [ ] Repository initialized
- [ ] Docker Compose skeleton running
- [ ] Authentication implemented
- [ ] RBAC implemented
- [ ] Case management implemented
- [ ] Document upload implemented
- [ ] File integrity (SHA-256) implemented
- [ ] Version control implemented
- [ ] Audit trail implemented
- [ ] OCR implemented
- [ ] Search implemented
- [ ] Investigation timeline implemented
- [ ] Secure sharing implemented
- [ ] AI assistance implemented
- [ ] Security hardening pass complete
- [ ] Full test pass complete
- [ ] Deployment finalized
- [ ] SIH demo rehearsed

## 7. In-Progress Features

_None._

## 8. Pending Features

All features listed in Section 6's checklist are pending, in the order defined by `Phases.md` (Phase 0 → Phase 16).

## 9. Known Bugs

_None — no code has been written yet._

## 10. Known Limitations

- This is a hackathon prototype using **synthetic/demo data only**; it is not connected to and does not replace CCTNS, ICJS, eCourts, e-Filing, or e-Forensics.
- SHA-256 integrity verification confirms byte-level integrity only — it does not establish legal authenticity, authorship, or admissibility (see `Rules.md` §17).
- AI features are advisory-only and are not a substitute for investigator or legal judgment (see `Rules.md` §16).
- Search is PostgreSQL full-text search for MVP; relevance quality is expected to be basic compared to a dedicated search engine.

## 11. Current Database Schema Status

UNKNOWN — no Prisma schema has been written yet. Target schema is documented (not yet implemented) in `Architecture.md` (Entity-Relationship Model).

## 12. Current API Status

UNKNOWN — no endpoints implemented yet. Target endpoint list is documented (not yet implemented) in `Architecture.md` §21.

## 13. Current Frontend Status

UNKNOWN — no frontend implemented yet. Target structure documented (not yet implemented) in `Architecture.md` §3 and `Design.md`.

## 14. Security Status

UNKNOWN — no code exists to audit yet. `Rules.md` defines the binding security requirements that all future implementation must satisfy; a security review is explicitly scheduled as Phase 13.

## 15. Testing Status

UNKNOWN — no tests exist yet. Testing approach is defined in `Rules.md` §13 and `Phases.md` (per-phase test requirements, plus a dedicated Phase 14).

## 16. Deployment Status

UNKNOWN — no deployment configuration exists yet beyond the target design in `Architecture.md` §23. Deployment finalization is scheduled as Phase 15.

## 17. Demo Status

UNKNOWN — no demo has been prepared. Demo preparation is scheduled as Phase 16.

## 18. Important Decisions

| Date | Decision | Rationale |
|---|---|---|
| Project start | Use synthetic/demo data only, no real government data or integrations | Ethical/legal safety, matches SIH prototype expectations, per `PRD.md` §30 |
| Project start | Documentation-first approach: create PRD/Architecture/Rules/Phases/Design/Memory before any code | Ensures a single, consistent source of truth for all future development |
| Project start | Modular monolith (not microservices) for MVP | Reduces operational complexity for hackathon timeline |
| Project start | PostgreSQL full-text search for MVP; OpenSearch only if justified later | Avoids premature infrastructure complexity |

## 19. Open Questions

- Job queue implementation for background workers: plain PostgreSQL-backed table vs. Redis+BullMQ — to be decided at Phase 8 based on available time.
- Exact `403` vs `404` policy per endpoint for unauthorized resource access (existence-hiding vs. plain forbidden) — to be finalized during Phase 2/3 implementation and documented back into `Architecture.md`/`Rules.md`.
- Whether email notifications will be a real integration or fully stubbed for the demo — to be decided during Phase 15/16 based on remaining time.

## 20. Blockers

_None currently._

## 21. Next Actions

1. Begin **Phase 0 — Foundation** per `Phases.md`: initialize repository structure, Docker Compose skeleton, base Next.js and NestJS apps, Prisma connection, `.env.example`.
2. After Phase 0 is implemented and tested, update this file's Sections 1, 3, 6, 11–13, and 21 before starting Phase 1.

## 22. Work Log

| Date | Entry |
|---|---|
| Project start | Created full documentation set: `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`. No application code written yet. Project status: Planning / Foundation. |

---

## AI Handoff Instructions

If you are an AI coding agent picking up this project:

1. **Read in this order:** `PRD.md` → `Architecture.md` → `Rules.md` → `Phases.md` → `Design.md` → this file (`Memory.md`) last, since it tells you the *actual* current state.
2. **Trust `Memory.md` over your assumptions.** If `Memory.md` says a feature is not implemented, treat it as not implemented even if code resembling it exists — verify before trusting.
3. **Work one phase at a time**, per `Phases.md`. Do not skip ahead or batch multiple phases into one change.
4. **Never mark a checkbox complete without actual, tested implementation.** If uncertain, write `UNKNOWN` and investigate rather than guessing.
5. **Follow `Rules.md` without exception**, especially the security rules (§3) and the AI/hashing wording rules (§16–17).
6. **Update this file** (Current Phase, status sections, checkboxes, Work Log) at the end of every phase, and immediately if you discover a bug, blocker, or need to change an earlier decision.
7. **If a change requires updating `PRD.md`, `Architecture.md`, `Rules.md`, `Design.md`, or `Phases.md`, do that in the same change** — do not let documentation drift from reality.
8. **Never fabricate integrations** with CCTNS/ICJS/eCourts/e-Filing/e-Forensics, and never introduce real personal/case data — synthetic/demo data only, per `PRD.md` and `Rules.md`.
