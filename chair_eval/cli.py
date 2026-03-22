from __future__ import annotations

import argparse

from .evaluator import evaluate
from .extractor import extract_features
from .models import BudgetRange
from .recommendations import recommend_alternatives
from .report import render_report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate office chair ergonomics and suggest better alternatives."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--url", help="Product URL for the current chair.")
    group.add_argument("--description", help="Free-text chair description.")
    parser.add_argument("--budget-min", type=int, help="Minimum budget in USD.")
    parser.add_argument("--budget-max", type=int, help="Maximum budget in USD.")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    is_url = bool(args.url)
    source = args.url if is_url else args.description

    extraction = extract_features(source=source, is_url=is_url)
    evaluation = evaluate(extraction.features)

    budget = BudgetRange(min_usd=args.budget_min, max_usd=args.budget_max)

    recs = recommend_alternatives(
        current_eval=evaluation,
        current_features=extraction.features,
        budget_min=args.budget_min,
        budget_max=args.budget_max,
        limit=4,
    )

    report = render_report(
        extraction=extraction,
        evaluation=evaluation,
        recommendations=recs,
        budget=budget,
        input_kind="url" if is_url else "description",
    )
    print(report)


if __name__ == "__main__":
    main()
