from __future__ import annotations

from .models import BudgetRange, ErgonomicEvaluation, FeatureExtractionResult, Recommendation


def _fmt_feature_name(name: str) -> str:
    return name.replace("_", " ").title()


def _fmt_feature_value(value: str) -> str:
    return value.replace("_", " ")


def render_report(
    extraction: FeatureExtractionResult,
    evaluation: ErgonomicEvaluation,
    recommendations: list[Recommendation],
    budget: BudgetRange,
    input_kind: str,
) -> str:
    lines: list[str] = []

    lines.append("Chair Summary")
    lines.append(f"- Input type: {input_kind}")
    if budget.min_usd is not None or budget.max_usd is not None:
        lines.append(f"- Budget: ${budget.min_usd or 0} - ${budget.max_usd or 'open'}")

    lines.append("- Extracted features:")
    for name, value in extraction.features.__dict__.items():
        lines.append(f"  - {_fmt_feature_name(name)}: {_fmt_feature_value(value)}")

    if extraction.assumptions:
        lines.append("- Assumptions made:")
        for assumption in extraction.assumptions:
            lines.append(f"  - {assumption}")

    lines.append("")
    lines.append("Ergonomic Evaluation")
    for item in evaluation.breakdown:
        lines.append(
            f"- {item.category}: {item.score:.1f}/{item.max_score:.1f}. {item.reason}"
        )
    lines.append("- Principles used:")
    for principle in evaluation.principles:
        lines.append(f"  - {principle}")

    lines.append("")
    lines.append("Score")
    lines.append(
        f"- Overall: {evaluation.total_score:.1f}/10 ({evaluation.band})"
    )
    lines.append(
        "- Band meaning: 1-4 Red (high strain risk), 5-7 Yellow (adequate with limitations), 8-10 Green (strong long-duration support)."
    )

    lines.append("")
    lines.append("Impact on Body")
    for impact in evaluation.body_impact:
        lines.append(f"- {impact}")

    if evaluation.total_score <= 7.0:
        lines.append("")
        lines.append("Recommended Alternatives")
        if recommendations:
            for rec in recommendations:
                lines.append(
                    f"- {rec.option.name} (${rec.option.price_usd}, score {rec.score:.1f}/10): {rec.option.value_note}"
                )
                if rec.improvements:
                    for improvement in rec.improvements:
                        lines.append(f"  - Better because: {improvement}")
        else:
            lines.append("- No direct matches found in catalog; broaden budget for more options.")

    return "\n".join(lines)
