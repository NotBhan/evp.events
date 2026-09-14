# Taste — Verification & Testing
- Uses pnpm and `git diff --check` as part of the standard regression gate (alongside `tsc --noEmit` and the build). Confidence: 0.6
- After a fix is applied, expects full end-to-end verification rather than code reasoning alone: run the type checker (e.g. `tsc --noEmit`) and a build, then exercise the real flow against the live test environment (create a fresh test record, drive the actual third-party checkout/payment with the standard test card, confirm success). Confidence: 0.85
- Expects test data to be cleaned up and state restored to its pre-test baseline after verification (delete test records, restore inventory counters). Confidence: 0.8
- Expects side effects to be proven exactly-once and replay/idempotency explicitly tested (e.g. counters change exactly once; replaying an event leaves state unchanged). Confidence: 0.75
- Gives explicit numbered acceptance checklists for a change and expects every item to be executed and reported on individually. Confidence: 0.7
- Does not rely solely on local tests when a bug lives in the deployed environment — requires proving the fix in the actual deployment (e.g. Vercel) with a fresh real flow before declaring completion. Confidence: 0.8
- Never mutates real/production records during diagnosis; tests use unique temporary records so live data stays untouched. Confidence: 0.75
- Does not assume a repo file is what runs in an external managed service (e.g. Apps Script Code.gs): editing the repo does not auto-deploy, so verifies the live deployment/version matches before relying on the repo code. Confidence: 0.8
