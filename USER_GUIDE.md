# 📖 User Guide: Secure Digital Document Management System (SDMS)
### SIH Problem Statement 26190 — Legal & Investigation Records Management

---

## 📌 1. Introduction & Overview

The **Secure Digital Document Management System (SDMS)** is an enterprise-grade, role-based, tamper-evident digital custody and document management platform built for investigation agencies, legal teams, supervisors, and compliance auditors.

### Key Capabilities
- 🔐 **Cryptographic SHA-256 Integrity Verification**: Calculates live hashes at file intake and re-verifies raw stored bytes from private object storage on demand to detect file tampering.
- 📜 **Strict Version Control**: Multi-version support (`v1`, `v2`, `v3`...) with current pointers, preserving an unalterable history of every version.
- 🛡️ **Two-Layer Access Control (RBAC + Case Scoping)**: 6 role definitions paired with case-level membership checks.
- 👁️ **Immutable Audit Trail**: Append-only log recording all security, upload, verification, and sharing events.
- 📄 **Automated OCR & Search**: Tesseract background worker extracts text from scanned PDFs/images into a permission-scoped search index.
- 🔗 **Time-Bound Scoped Sharing**: Expiring public/scoped share URLs with instant revocation.
- 🤖 **Advisory-Only AI Triage**: Summarization and entity extraction with mandatory advisory disclaimers.

> ⚠️ **Synthetic Data & Ethical Notice**: This prototype operates exclusively with synthetic data for SIH 26190 demonstration purposes. SHA-256 confirms byte matching only, and AI analysis is strictly advisory.

---

## 🌐 2. Quick Access & Endpoints

| Resource | URL | Details / Credentials |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Main user interface |
| **Backend REST API** | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) | Express API service |
| **MinIO Web Console** | [http://localhost:9006](http://localhost:9006) | User: `minioadmin` \| Pass: `minioadmin` |
| **PostgreSQL Database** | `localhost:5432` | User: `sdms` \| Pass: `sdms_password` \| DB: `sdms` |

---

## 👥 3. Pre-Configured Demo Personas

All accounts use the common password: **`DemoPass@123`**

You can click any **Quick-Fill** persona card on the Login screen ([http://localhost:3000/login](http://localhost:3000/login)) to populate credentials instantly:

| Role / Persona | Email Address | Primary Responsibilities & Privileges |
| :--- | :--- | :--- |
| **Case Officer / Investigator** | `investigator.sharma@sdms.gov.in` | Create cases, upload documents/FIRs, manage evidence, build timelines |
| **Supervisor / Reviewing Officer** | `supervisor.verma@sdms.gov.in` | Review case files, approve records, cross-case oversight |
| **Legal Officer / Prosecutor** | `prosecutor.mehta@sdms.gov.in` | Examine evidence custody, verify SHA-256 digests, prepare court filings |
| **Auditor** | `auditor.gupta@sdms.gov.in` | Inspect immutable audit logs, verify compliance events (`/audit`) |
| **Super Admin** | `admin@sdms.gov.in` | User provisioning, system configuration, role assignment (`/admin`) |
| **Records Clerk** | `clerk.singh@sdms.gov.in` | Document intake, indexing, and OCR queue management |

---

## 🚀 4. Step-by-Step Feature Guide

### Step 1: Login & Authentication
1. Go to [http://localhost:3000/login](http://localhost:3000/login).
2. Click any of the **Quick-Fill Demo Personas** (e.g., *Inspector Ramesh Sharma*).
3. Click **Sign In to Secure Workspace**.
4. The system issues a secure `httpOnly` session cookie (`sdms_session`).

---

### Step 2: Investigation Cases Management
1. Navigate to **Cases** in the top navigation bar (`/cases`).
2. **View Cases**: Inspect active cases like `CASE/2026/0891` (*Cyber Fraud & Shell Account Laundering*).
3. **Create a Case**:
   - Click the **+ New Case** button.
   - Enter Case Number (e.g., `CASE/2026/1042`), Case Title, Priority (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), and Description.
   - Click **Create Investigation Case**.
4. **Open Case Workspace**: Click on any case card to open its detailed investigation workspace.

---

### Step 3: Working Inside a Case Workspace
Inside any case workspace (`/cases/[id]`):
- 📁 **Case Documents**: Lists all uploaded FIRs, forensic reports, seizure memos, and witness statements.
- ⏱️ **Investigation Timeline**: Chronological trail of key events (FIR registration, evidence seizures, forensic filings).
- 📦 **Evidence Locker**: Physical and digital items in custody with evidence reference numbers and vault locations.
- 👥 **Assigned Officers**: Displays lead investigator, supervisor, and prosecutor assigned to the case.

---

### Step 4: Uploading Documents & Cryptographic Hashing
1. Inside a case, click **Upload Document**.
2. Select a file (PDF, PNG, JPG, or DOCX).
3. Fill in:
   - **Document Title** (e.g., *Bank Transaction Audit Log*)
   - **Document Type** (`FIR`, `FORENSIC_REPORT`, `WITNESS_STATEMENT`, `SEIZURE_MEMO`, `COURT_ORDER`, etc.)
   - **Tags** (comma-separated, e.g., `Cyber, BankLogs, Audit`)
4. Click **Upload & Compute SHA-256 Digest**.
5. **What Happens Behind the Scenes:**
   - The backend computes a cryptographic **SHA-256 digest** of the exact file bytes.
   - The file is stored in private MinIO S3 storage (`sdms-documents` bucket).
   - An immutable version `v1` record is created.
   - A background OCR extraction job is automatically queued.
   - An immutable `document.upload` event is recorded in the Audit Log.

---

### Step 5: Live SHA-256 Integrity Verification (Tamper Detection)
1. Click on any document from the case file list to open the **Document Detail Page** (`/documents/[id]`).
2. Click the **Verify SHA-256 Digest** button (shield icon).
3. **Live Verification Mechanism:**
   - The server streams raw file bytes directly from MinIO object storage.
   - Recomputes the live SHA-256 hash in real-time.
   - Compares the live hash against the registered intake hash.
   - Displays a green badge `MATCH CONFIRMED` with exact timestamps and byte counts.
   - Logs an audit event `document.verify_integrity`.

---

### Step 6: Version Control (Uploading v2, v3...)
1. On the document detail page, click **Upload New Version**.
2. Select an updated or certified file.
3. Click **Upload Version**.
4. The system creates `v2` with its own unique SHA-256 hash while preserving `v1` intact in historical version tabs.

---

### Step 7: OCR Text Extraction
1. On the document page, scroll down to the **OCR Text Extraction (Tesseract)** panel.
2. The background worker automatically extracts text from the document.
3. You can read the extracted text or click **Copy Text** for legal transcription.

---

### Step 8: Advisory-Only AI Analysis
1. On the document page, look at the **Advisory AI Document Triage** panel on the right.
2. If analysis hasn't run yet, click **Run AI Analysis**.
3. The AI engine provides:
   - **Executive Summary**: High-level abstract of the document.
   - **Suggested Classification**: Automated document type recommendation.
   - **Extracted Entities**: People names, Dates, and Locations identified in the text.
4. *Notice the persistent warning banner*: `AI-Generated Output — Strictly Advisory Only`.

---

### Step 9: Scoped & Expiring Sharing
1. On the document page, click **Share Document**.
2. Configure share settings:
   - **Access Scope**: `VIEW_ONLY` (watermarked in-browser view) or `DOWNLOAD_ALLOWED`.
   - **Expiry Duration**: 1 Hour, 24 Hours, 7 Days, or 30 Days.
3. Click **Generate Scoped Share Link**.
4. Copy the generated URL (`/shared/[token]`) and test it in an incognito window.
5. You can instantly revoke active share links from the Share modal at any time.

---

### Step 10: Full-Text Scoped Search
1. Click **Search** in the navigation bar (`/search`).
2. Enter keywords (e.g., `Cyber`, `Inspector Sharma`, `14-Aug-2026`, or `Seizure`).
3. The search queries across document titles, tags, and OCR extracted text while strictly enforcing user case permissions.

---

### Step 11: Immutable Audit Trail (`/audit`)
1. Log in as `auditor.gupta@sdms.gov.in` (or click Auditor on login).
2. Navigate to **Audit Logs** (`/audit`).
3. View the append-only record of every system event:
   - User logins & logouts
   - Document uploads & downloads
   - Cryptographic SHA-256 integrity verifications
   - Share link generation & access
   - Role modifications
4. Use filter dropdowns to filter by **Action Type**, **Outcome**, or **Date Range**.

---

### Step 12: Admin User Management (`/admin`)
1. Log in as `admin@sdms.gov.in`.
2. Navigate to **System Administration** (`/admin`).
3. View registered users, activate/deactivate accounts, and assign system roles.

---

## 🧪 5. Demonstration Walkthrough for Evaluators

| Demo Flow | Persona to Use | Action Steps | Key Evaluation Criteria Demonstrated |
| :--- | :--- | :--- | :--- |
| **1. File Intake & Hashing** | Investigator | Go to `CASE/2026/0891` → Upload file | Immediate SHA-256 computation before storage |
| **2. Live Tamper Verification** | Legal Officer / Prosecutor | Open FIR document → Click *Verify SHA-256 Digest* | Live byte-level stream re-hashing from S3 |
| **3. OCR & Advisory AI** | Records Clerk / Investigator | Open document → View OCR & AI tabs | Background job queue execution, disclaimer adherence |
| **4. Scoped Sharing & Revocation** | Investigator | Click *Share Document* → Copy link → Revoke link | Time-bound token expiry & instant access termination |
| **5. Compliance Inspection** | Auditor | Visit `/audit` → Filter by `document.verify_integrity` | Tamper-proof, insert-only audit logging |

---

## 🛠️ 6. Service Management & Troubleshooting

### Restarting Services
If you close terminal sessions or restart your machine:
```bash
# 1. Start Docker containers
docker start sdms-postgres sdms-minio

# 2. Start services (in separate terminals or background)
npm run dev:backend   # API on :4000
npm run dev:worker    # Queue Worker
npm run dev:frontend  # Next.js UI on :3000
```

### Resetting & Re-seeding Data
To wipe and re-seed clean synthetic demo data:
```bash
npm run prisma:push --workspace=apps/backend -- --force-reset
npm run prisma:seed --workspace=apps/backend
```
