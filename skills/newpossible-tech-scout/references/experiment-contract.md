# Minimal experiment contract

Define this before running a candidate:

```json
{
  "candidate": "name and pinned version or commit",
  "claim": "one falsifiable capability claim",
  "baseline": "current approach or measured absence",
  "input": "fixed representative fixture",
  "metrics": ["correctness metric", "capability or performance metric"],
  "success": "explicit thresholds",
  "budget": "time, disk, memory, GPU and network limits",
  "executor": "local, API, or registered GPU experiment id",
  "rollback": "how temporary resources are removed"
}
```

The candidate and baseline must receive equivalent inputs. Warm-up, repetitions, transfer costs, and excluded setup time must be stated for performance comparisons. Preserve raw observations even when the result is negative.

Map the outcome as follows:

- `adopt`: correctness passes and the capability threshold is met.
- `watch`: correctness passes but the improvement is insufficient or the proof is incomplete.
- `reject`: correctness fails, required constraints are violated, or the claim is disproved.
- `unverified`: execution did not produce trustworthy current-run evidence.
