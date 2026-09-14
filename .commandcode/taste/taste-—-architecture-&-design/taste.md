# Taste — Architecture & Design
- External side-effect integrations (e.g. Google Sheets writes) must stay server-side and read server-only env vars, never browser-facing/NEXT_PUBLIC. Confidence: 0.8
- Side effects must run after the primary DB transaction commits — never inside it — and their failure must not roll back the primary operation. Confidence: 0.8
- Rejects fire-and-forget side effects without persisted recovery: sync failures must be recorded (status/attempts/error) and remain retryable. Confidence: 0.75
- External writes must upsert by a stable business key rather than blindly appending duplicate rows. Confidence: 0.7
- Prefers explicit, pinned identifiers/configuration over ambient or active-context resolution — e.g. an Apps Script write must target SpreadsheetApp.openById(id).getSheetByName(tab), never getActiveSpreadsheet()/getActiveSheet(). Confidence: 0.85
- When modifying an existing external write path, preserves the existing destination schema/column layout rather than reshaping it (e.g. keep the existing 11-column layout). Confidence: 0.7
