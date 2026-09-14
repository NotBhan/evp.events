# Taste — Debugging & Investigation Preferences

- Prefers diagnosis-first debugging: investigate and report the exact, evidence-based root cause before making any code changes ("do not modify code yet"). Confidence: 0.85
- Distrusts guessed explanations — wants the actual error code/message from the real system (query the live DB, retrieve the real API objects) rather than a plausible-sounding cause. Confidence: 0.8
- Wants changes scoped tightly: do not "blindly modify" adjacent, already-working subsystems, and do not touch unrelated areas without being asked — including during configuration/integration tasks (e.g. explicit "do not modify the webhook code" while setting up an endpoint). Confidence: 0.85
- Expects a structured investigation report with the findings for each area (actual state per component) before any proposed fix, and asks before applying changes. Confidence: 0.7

# Taste — Security Handling

- Do not print or expose secrets in output/logs — Stripe secret keys, webhook signing secrets, DATABASE_URL/connection strings, or any full credentials — nor sensitive payment details (card data). Confidence: 0.8
- When reporting on env/config, reports only PRESENT/MISSING (presence/absence) and never the actual value; when an identifier must be shown for comparison, exposes only a safe partial (e.g. last few chars), and redacts endpoint URLs to host only. Confidence: 0.8
- Prefers safe diagnostics that surface identifiers/status/attempt counts over raw payloads or secret values. Confidence: 0.75

# Taste — Tooling & Workflow

- Prefers configuring external services (e.g. Stripe) via the official CLI/API, self-service, using credentials from environment only, rather than instructing the user to navigate a GUI/Dashboard menu. Confidence: 0.8
- Before creating/registering an external resource (e.g. a webhook endpoint), inspects existing ones first to avoid duplicates. Confidence: 0.8
- When a tool can't accomplish the task, prefers stopping and reporting the exact limitation plus the currently supported configuration path, rather than hacking around it or changing application code. Confidence: 0.75
- Cleans up temporary scripts/files created during investigation afterward (leaves the repo clean). Confidence: 0.7

# Taste — Architecture & Design
See [taste-—-architecture-&-design/taste.md](taste-—-architecture-&-design/taste.md)
# Taste — Verification & Testing
See [taste-—-verification-&-testing/taste.md](taste-—-verification-&-testing/taste.md)
taste-—-verification-&-testing/taste.md)
