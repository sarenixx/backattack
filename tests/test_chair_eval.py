import unittest

from chair_eval.evaluator import evaluate
from chair_eval.extractor import extract_features
from chair_eval.models import ChairFeatures
from chair_eval.recommendations import recommend_alternatives


class ExtractorTests(unittest.TestCase):
    def test_explicit_features_are_detected(self) -> None:
        text = (
            "Ergonomic chair with adjustable lumbar support, seat depth adjust, "
            "4D armrests, tilt and recline, mesh back, and adjustable headrest."
        )
        result = extract_features(text, is_url=False)

        self.assertEqual(result.features.lumbar_support, "adjustable")
        self.assertEqual(result.features.seat_depth, "adjustable")
        self.assertEqual(result.features.adjustability, "high")
        self.assertEqual(result.features.material, "mesh")
        self.assertEqual(result.features.headrest, "adjustable")

    def test_missing_data_generates_assumptions(self) -> None:
        result = extract_features("Simple office chair", is_url=False)
        self.assertTrue(result.assumptions)
        self.assertEqual(result.features.seat_depth, "standard")

    def test_no_lumbar_phrase_is_not_misclassified(self) -> None:
        result = extract_features(
            "Task chair with no lumbar support and fixed backrest.",
            is_url=False,
        )
        self.assertEqual(result.features.lumbar_support, "none")


class EvaluatorTests(unittest.TestCase):
    def test_low_end_chair_scores_red_or_yellow_low(self) -> None:
        poor = ChairFeatures(
            lumbar_support="none",
            seat_depth="deep",
            seat_width="narrow",
            cushioning="low",
            backrest_height="low",
            backrest_flexibility="low",
            adjustability="low",
            material="leather",
            headrest="none",
        )
        evaluation = evaluate(poor)
        self.assertLessEqual(evaluation.total_score, 5.0)

    def test_strong_chair_scores_green(self) -> None:
        strong = ChairFeatures(
            lumbar_support="adjustable",
            seat_depth="adjustable",
            seat_width="standard",
            cushioning="high",
            backrest_height="high",
            backrest_flexibility="high",
            adjustability="high",
            material="mesh",
            headrest="adjustable",
        )
        evaluation = evaluate(strong)
        self.assertGreater(evaluation.total_score, 7.0)
        self.assertEqual(evaluation.band, "Green")


class RecommendationTests(unittest.TestCase):
    def test_budget_filters_recommendations(self) -> None:
        poor = ChairFeatures(
            lumbar_support="none",
            seat_depth="deep",
            seat_width="narrow",
            cushioning="low",
            backrest_height="low",
            backrest_flexibility="low",
            adjustability="low",
            material="leather",
            headrest="none",
        )
        poor_eval = evaluate(poor)
        recs = recommend_alternatives(
            current_eval=poor_eval,
            current_features=poor,
            budget_min=250,
            budget_max=380,
        )
        self.assertTrue(recs)
        for rec in recs:
            self.assertGreaterEqual(rec.option.price_usd, 250)
            self.assertLessEqual(rec.option.price_usd, 380)


if __name__ == "__main__":
    unittest.main()
