# Adoption output contract

Return a short human-readable adoption card. When the harness requests structured output or evidence is persisted, use this shape:

```json
{
  "candidate": "name and pinned version or commit",
  "decision": "adopt | watch | reject | unverified",
  "changed": "the capability that became possible or materially better",
  "projectFit": "why it matters to the stated objective and stack",
  "observation": {
    "baseline": "observed baseline or measured absence",
    "candidateResult": "observed candidate result",
    "correctness": "pass | fail | not-run",
    "environment": "where the observation was produced",
    "sourceVersion": "version, commit, image tag, or digest"
  },
  "reason": "one reason for the decision",
  "nextStep": "one bounded action or none",
  "limitations": ["condition that could reverse the decision"]
}
```

Rules:

- Use `adopt` only when correctness and the declared capability threshold pass in a current run.
- Use `unverified` when execution was skipped, simulated, interrupted, or performed on a materially different environment.
- Keep raw observations separate from model interpretation.
- Include at most one candidate. An empty candidate with `watch` is not a substitute for saying that nothing deserves attention.
