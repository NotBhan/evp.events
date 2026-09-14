# Taste — Debugging & Investigation Preferences

- Prefers diagnosis-first debugging: investigate and report the exact, evidence-based root cause before making any code changes ("do not modify code yet"). Confidence: 0.85
- Distrusts guessed explanations — wants the actual error code/message from the real system (query the live DB, retrieve the real API objects) rather than a plausible-sounding cause. Confidence: 0.8
- Wants changes scoped tightly: do not "blindly modify" adjacent, already-working subsystems, and do not touch unrelated areas without being asked. Confidence: 0.8
- Expects a structured investigation report with the findings for each area (actual state per component) before any proposed fix, and asks before applying changes. Confidence: 0.7

# Taste — Security Handling

- Do not print or expose secrets in output/logs (e.g., Stripe secret keys) or sensitive payment details (card data). Confidence: 0.75

# Taste — Verification & Testing

- After a fix is applied, expects full end-to-end verification rather than code reasoning alone: run the type checker (e.g. `tsc --noEmit`) and a build, then exercise the real flow against the live test environment (create a fresh test record, drive the actual third-party checkout/payment with the standard test card, confirm success). Confidence: 0.85
- Expects test data to be cleaned up and state restored to its pre-test baseline after verification (delete test records, restore inventory counters). Confidence: 0.8
- Expects side effects to be proven exactly-once and replay/idempotency explicitly tested (e.g. counters change exactly once; replaying an event leaves state unchanged). Confidence: 0.75
- Gives explicit numbered acceptance checklists for a change and expects every item to be executed and reported on individually. Confidence: 0.7
