from __future__ import annotations

from .models import ChairFeatures, ErgonomicEvaluation, ScoreBreakdownItem


_LUMBAR = {"adjustable": 2.0, "fixed": 1.2, "none": 0.2}
_SEAT_DEPTH = {"adjustable": 1.2, "standard": 1.0, "deep": 0.7, "shallow": 0.7}
_SEAT_WIDTH = {"standard": 0.8, "wide": 0.7, "narrow": 0.5}
_CUSHION = {"high": 1.3, "medium": 1.0, "low": 0.4}
_BACKREST_HEIGHT = {"high": 1.1, "medium": 0.9, "low": 0.5}
_BACK_FLEX = {"high": 1.1, "medium": 0.8, "low": 0.4}
_ADJUST = {"high": 1.7, "medium": 1.1, "low": 0.5}
_MATERIAL = {"mesh": 0.9, "foam_fabric": 0.8, "leather": 0.5}
_HEADREST = {"adjustable": 0.7, "fixed": 0.4, "none": 0.1}


def _band(score: float) -> str:
    if score <= 4.0:
        return "Red"
    if score <= 7.0:
        return "Yellow"
    return "Green"


def evaluate(features: ChairFeatures) -> ErgonomicEvaluation:
    raw = [
        ScoreBreakdownItem(
            category="Lumbar and spinal alignment",
            score=_LUMBAR[features.lumbar_support],
            max_score=2.0,
            reason=(
                "Adjustable lumbar can match natural lower-back curve."
                if features.lumbar_support == "adjustable"
                else "Fixed lumbar gives partial support but may not match body shape."
                if features.lumbar_support == "fixed"
                else "Missing lumbar support can increase lower-back flexion strain."
            ),
        ),
        ScoreBreakdownItem(
            category="Seat depth/width fit",
            score=_SEAT_DEPTH[features.seat_depth] + _SEAT_WIDTH[features.seat_width],
            max_score=2.0,
            reason="Seat dimensions affect thigh support and pressure behind knees.",
        ),
        ScoreBreakdownItem(
            category="Pressure distribution",
            score=_CUSHION[features.cushioning] + _MATERIAL[features.material],
            max_score=2.2,
            reason="Cushion density and breathability affect load distribution and circulation.",
        ),
        ScoreBreakdownItem(
            category="Posture sustainability",
            score=_BACKREST_HEIGHT[features.backrest_height] + _BACK_FLEX[features.backrest_flexibility],
            max_score=2.2,
            reason="Backrest support and movement reduce fatigue during long sitting.",
        ),
        ScoreBreakdownItem(
            category="Adjustability fit",
            score=_ADJUST[features.adjustability] + _HEADREST[features.headrest],
            max_score=2.4,
            reason="More adjustability improves fit across body types and work styles.",
        ),
    ]

    total_raw = sum(item.score for item in raw)
    total_max = sum(item.max_score for item in raw)
    normalized = max(1.0, min(10.0, round((total_raw / total_max) * 10.0, 1)))

    principles = [
        "Spinal alignment: lumbar and backrest geometry decide whether the lower back stays near neutral.",
        "Pressure and circulation: cushioning quality and breathable materials reduce hot spots and numbness risk.",
        "Posture endurance: flexible recline and tilt mechanisms reduce static loading over long sessions.",
        "Body-type fit: armrest, seat, and height adjustments let the chair match anthropometric differences.",
    ]

    body_impact: list[str] = []

    if features.lumbar_support == "none":
        body_impact.append(
            "Higher risk of lower-back pain because unsupported lumbar spine tends to collapse into flexion."
        )
    elif features.lumbar_support == "fixed":
        body_impact.append(
            "Moderate back-strain risk if fixed lumbar position does not align with your torso length."
        )
    else:
        body_impact.append(
            "Lower back-risk profile because lumbar support can be tuned to maintain spinal curve."
        )

    if features.cushioning == "low":
        body_impact.append(
            "Thin cushioning can increase pressure points in glutes/thighs and cause earlier fatigue."
        )

    if features.adjustability == "low":
        body_impact.append(
            "Limited adjustability can force compensatory posture (rounded shoulders or wrist elevation)."
        )
    elif features.adjustability == "high":
        body_impact.append(
            "High adjustability supports neutral shoulder, elbow, and hip positioning across tasks."
        )

    if features.material == "leather":
        body_impact.append(
            "Leather-heavy surfaces may trap heat, increasing discomfort and movement-related fatigue over long sessions."
        )

    if features.backrest_flexibility == "low":
        body_impact.append(
            "Rigid backrest may increase static muscle loading, especially during prolonged desk work."
        )

    return ErgonomicEvaluation(
        total_score=normalized,
        band=_band(normalized),
        breakdown=raw,
        principles=principles,
        body_impact=body_impact,
    )
