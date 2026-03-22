from __future__ import annotations

from .evaluator import evaluate
from .models import ChairFeatures, ChairOption, ErgonomicEvaluation, Recommendation


CATALOG: list[ChairOption] = [
    ChairOption(
        name="SIHOO M57 Ergonomic Chair",
        price_usd=299,
        value_note="Strong value for adjustable lumbar and breathable mesh.",
        features=ChairFeatures(
            lumbar_support="adjustable",
            seat_depth="adjustable",
            seat_width="standard",
            cushioning="medium",
            backrest_height="high",
            backrest_flexibility="high",
            adjustability="high",
            material="mesh",
            headrest="adjustable",
        ),
    ),
    ChairOption(
        name="HON Ignition 2.0",
        price_usd=430,
        value_note="Office-grade ergonomics without premium flagship pricing.",
        features=ChairFeatures(
            lumbar_support="adjustable",
            seat_depth="adjustable",
            seat_width="standard",
            cushioning="high",
            backrest_height="high",
            backrest_flexibility="high",
            adjustability="high",
            material="mesh",
            headrest="none",
        ),
    ),
    ChairOption(
        name="Branch Ergonomic Chair",
        price_usd=359,
        value_note="Balanced fit options and good long-session comfort for mid-budget buyers.",
        features=ChairFeatures(
            lumbar_support="adjustable",
            seat_depth="standard",
            seat_width="standard",
            cushioning="medium",
            backrest_height="high",
            backrest_flexibility="high",
            adjustability="high",
            material="mesh",
            headrest="none",
        ),
    ),
    ChairOption(
        name="IKEA Markus",
        price_usd=289,
        value_note="Budget-friendly high backrest option, but less adjustable than top picks.",
        features=ChairFeatures(
            lumbar_support="fixed",
            seat_depth="standard",
            seat_width="standard",
            cushioning="medium",
            backrest_height="high",
            backrest_flexibility="medium",
            adjustability="medium",
            material="foam_fabric",
            headrest="fixed",
        ),
    ),
    ChairOption(
        name="Steelcase Series 1",
        price_usd=549,
        value_note="Higher tier option with excellent adjustability for varied body types.",
        features=ChairFeatures(
            lumbar_support="adjustable",
            seat_depth="adjustable",
            seat_width="standard",
            cushioning="high",
            backrest_height="high",
            backrest_flexibility="high",
            adjustability="high",
            material="mesh",
            headrest="adjustable",
        ),
    ),
    ChairOption(
        name="Hbada E3 Pro",
        price_usd=479,
        value_note="Feature-rich alternative with strong neck and lumbar adjustability.",
        features=ChairFeatures(
            lumbar_support="adjustable",
            seat_depth="adjustable",
            seat_width="wide",
            cushioning="high",
            backrest_height="high",
            backrest_flexibility="high",
            adjustability="high",
            material="mesh",
            headrest="adjustable",
        ),
    ),
]


def _improvements(current: ChairFeatures, alt: ChairFeatures) -> list[str]:
    improvements: list[str] = []

    if current.lumbar_support != "adjustable" and alt.lumbar_support == "adjustable":
        improvements.append("Adds adjustable lumbar support for better spinal alignment.")
    if current.adjustability != "high" and alt.adjustability == "high":
        improvements.append("Offers more armrest/tilt/recline adjustability for body-type fit.")
    if current.backrest_flexibility != "high" and alt.backrest_flexibility == "high":
        improvements.append("Improves dynamic back support to reduce static muscle fatigue.")
    if current.material == "leather" and alt.material == "mesh":
        improvements.append("Improves breathability to reduce heat buildup and sitting discomfort.")
    if current.cushioning in {"low", "medium"} and alt.cushioning == "high":
        improvements.append("Provides denser cushioning for better pressure distribution.")

    return improvements


def recommend_alternatives(
    current_eval: ErgonomicEvaluation,
    current_features: ChairFeatures,
    budget_min: int | None,
    budget_max: int | None,
    limit: int = 4,
) -> list[Recommendation]:
    if current_eval.total_score > 7.0:
        return []

    candidates = CATALOG
    if budget_max is not None:
        candidates = [c for c in candidates if c.price_usd <= budget_max]
    if budget_min is not None:
        candidates = [c for c in candidates if c.price_usd >= budget_min]

    if not candidates:
        candidates = CATALOG

    ranked: list[Recommendation] = []
    for option in candidates:
        alt_eval = evaluate(option.features)
        if alt_eval.total_score <= current_eval.total_score:
            continue
        ranked.append(
            Recommendation(
                option=option,
                score=alt_eval.total_score,
                improvements=_improvements(current_features, option.features),
            )
        )

    ranked.sort(key=lambda r: (r.score, -r.option.price_usd), reverse=True)

    return ranked[: max(2, min(limit, 4))]
