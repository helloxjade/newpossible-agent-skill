import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "scripts" / "score_candidates.py"
SPEC = importlib.util.spec_from_file_location("score_candidates", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ScoreCandidatesTest(unittest.TestCase):
    def test_ranks_relevant_candidate_and_rejects_irrelevant_candidate(self):
        candidates = [
            {
                "id": "reject-me",
                "relevance": 1,
                "delta": 3,
                "feasibility": 3,
                "evidence": 3,
                "proofCost": 3,
            },
            {
                "id": "prove-me",
                "relevance": 3,
                "delta": 3,
                "feasibility": 3,
                "evidence": 2,
                "proofCost": 3,
            },
        ]

        result = MODULE.score_candidates(candidates)

        self.assertEqual(result[0]["id"], "prove-me")
        self.assertEqual(result[0]["decision"], "prove")
        self.assertEqual(result[1]["decision"], "reject")


if __name__ == "__main__":
    unittest.main()
