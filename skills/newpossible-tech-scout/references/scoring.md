# Candidate scoring

Use this only when two or more candidates could plausibly matter. Score each dimension from 0 to 3.

| Dimension | 0 | 1 | 2 | 3 | Weight |
|---|---|---|---|---|---|
| Project relevance | unrelated | adjacent | useful | directly unlocks the objective | 3 |
| Capability delta | cosmetic | small convenience | material improvement | previously impractical task becomes practical | 3 |
| Feasibility | blocked | major setup | bounded setup | runnable now | 2 |
| Evidence quality | claim only | vendor example | reproducible method | current-run observation | 2 |
| Proof cost | days | hours | under 30 minutes | under 10 minutes | 2 |

Calculate the weighted total out of 36. Use these gates before ranking:

- Reject candidates with project relevance below 2.
- Reject candidates that require unavailable data, credentials, hardware, or irreversible changes.
- Prefer a lower-scoring candidate when it has a decisive experiment and the higher-scoring candidate cannot be verified.
- A score below 24 remains `watch` unless the user explicitly wants exploratory research.

Input for `scripts/score_candidates.py` is a JSON array containing `id`, `title`, and numeric `relevance`, `delta`, `feasibility`, `evidence`, and `proofCost` fields.
