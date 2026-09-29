#!/usr/bin/env python3
import json
import sys
from pathlib import Path

STANDARD_WEIGHT = 2
PRIORITY_WEIGHT = STANDARD_WEIGHT + 1
MAX_RATING = PRIORITY_WEIGHT
MIN_RELEVANCE = 2
PROVE_THRESHOLD = PRIORITY_WEIGHT * (
    PRIORITY_WEIGHT + STANDARD_WEIGHT + PRIORITY_WEIGHT
)
DIMENSIONS = (
    ("relevance", PRIORITY_WEIGHT),
    ("delta", PRIORITY_WEIGHT),
    ("feasibility", STANDARD_WEIGHT),
    ("evidence", STANDARD_WEIGHT),
    ("proofCost", STANDARD_WEIGHT),
)


def score_candidates(candidates):
    if not isinstance(candidates, list):
        raise ValueError("Candidate input must be a JSON array")

    for candidate in candidates:
        for field, _weight in DIMENSIONS:
            value = candidate.get(field)
            if (
                not isinstance(value, int)
                or isinstance(value, bool)
                or not 0 <= value <= MAX_RATING
            ):
                raise ValueError(
                    f"{candidate.get('id', 'candidate')}: "
                    f"{field} must be an integer from 0 to {MAX_RATING}"
                )
        score = sum(candidate[field] * weight for field, weight in DIMENSIONS)
        candidate["score"] = score
        candidate["decision"] = (
            "reject"
            if candidate["relevance"] < MIN_RELEVANCE
            else "prove"
            if score >= PROVE_THRESHOLD
            else "watch"
        )

    candidates.sort(key=lambda item: (-item["score"], str(item.get("id", ""))))
    return candidates


def main(argv):
    if len(argv) != 2:
        raise SystemExit("Usage: python3 scripts/score_candidates.py candidates.json")
    candidates = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    print(json.dumps(score_candidates(candidates), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(sys.argv)
