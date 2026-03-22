# Build an office-chair ergonomic evaluator CLI

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

`PLANS.md` exists at the repository root, and this document is maintained in accordance with `/workspaces/backattack/PLANS.md`.

## Purpose / Big Picture

After this change, a user can run one command with either a product URL or a free-form chair description and receive a structured ergonomic report: extracted features, medical/ergonomic evaluation rationale, a 1-10 score with color band, practical body-impact interpretation, and better alternatives when the score is 7 or below. The behavior is observable by running the CLI and reading the generated report.

## Progress

- [x] (2026-03-22 00:00Z) Reviewed repository state and requirements from user prompt.
- [x] (2026-03-22 00:02Z) Authored this ExecPlan and aligned it to `PLANS.md` requirements.
- [x] (2026-03-22 00:12Z) Implemented `chair_eval` package with extraction, scoring, impact explanation, and recommendation engine.
- [x] (2026-03-22 00:16Z) Added CLI entrypoint and structured report formatting.
- [x] (2026-03-22 00:20Z) Added unit tests for extraction assumptions, score classification, and budget-aware recommendations.
- [x] (2026-03-22 00:22Z) Ran test suite successfully (`python -m unittest discover -s tests -v`).
- [x] (2026-03-22 00:24Z) Updated README with usage examples.
- [x] (2026-03-22 00:27Z) Fixed lumbar extraction bug (`no lumbar support` misclassification) and added regression test.

## Surprises & Discoveries

- Observation: The repository started nearly empty, so the fastest reliable path was a dependency-light Python standard-library implementation.
  Evidence: `ls -la` showed only `README.md`, `AGENTS.md`, `PLANS.md`.
- Observation: `rg` is not installed in this environment, so file discovery used shell alternatives.
  Evidence: `/bin/bash: line 1: rg: command not found`.
- Observation: Phrase ordering in regex rules matters; matching generic `lumbar` before `no lumbar` caused a false positive.
  Evidence: Initial CLI run classified “no lumbar support” as adjustable; regression test now asserts `none`.

## Decision Log

- Decision: Implement the feature as a Python CLI package (`python -m chair_eval.cli`) instead of a web app.
  Rationale: The request emphasizes evaluation logic and structured output; CLI is fastest to deliver and easy to automate.
  Date/Author: 2026-03-22 / Codex
- Decision: Use rule-based extraction with explicit assumptions instead of model inference.
  Rationale: Keeps behavior transparent and deterministic, and avoids requiring external API keys.
  Date/Author: 2026-03-22 / Codex
- Decision: Include a curated internal recommendation catalog with value-oriented options and broad budget coverage.
  Rationale: Requirement explicitly asks to avoid premium-only recommendations and to include practical alternatives.
  Date/Author: 2026-03-22 / Codex

## Outcomes & Retrospective

Implemented an end-to-end ergonomic evaluator that produces actionable, structured reports from either URL-derived text or user descriptions. The resulting tool is deterministic, test-covered, and runnable without third-party services. During validation, a lumbar parsing edge case was discovered and fixed with test coverage. Remaining gap: URL extraction is intentionally lightweight (best-effort HTML text scraping) and can be improved later with richer structured data parsing.

## Context and Orientation

This repository now centers on a single Python package:

- `chair_eval/models.py` defines feature/value models and recommendation records.
- `chair_eval/extractor.py` ingests a URL or description, maps evidence keywords into ergonomic feature levels, and records assumptions for missing data.
- `chair_eval/evaluator.py` converts features into weighted ergonomic scores and medical-principle explanations (spinal support, pressure distribution, posture sustainability, and adjustability fit).
- `chair_eval/recommendations.py` contains a curated list of alternatives and logic to filter/sort them by budget and ergonomic score.
- `chair_eval/report.py` renders the required output sections in plain text.
- `chair_eval/cli.py` is the command-line interface.
- `tests/test_chair_eval.py` validates core behavior.

The term “rule-based extraction” means deterministic mapping from detected terms (for example “adjustable lumbar”, “4D armrest”, “mesh”) to normalized feature values.

## Plan of Work

Implement the package in additive steps. First define typed models for features and evaluation results. Then create extraction helpers that can load text from a URL and infer feature states from known ergonomic keywords. Add evaluator logic with weighted contributions per feature and penalties for known strain risks (for example no lumbar support). Build a recommendation module with a catalog of chairs that includes value options, then filter recommendations within user budget (or by tiers when budget is omitted). Finally add report rendering and CLI argument parsing, then validate with unit tests and usage examples.

## Concrete Steps

From `/workspaces/backattack`:

1. Implement package and tests.
2. Run:

       python -m unittest discover -s tests -v

3. Manually run the CLI example:

       python -m chair_eval.cli --description "Fixed-back task chair with no lumbar support and thin cushion" --budget-min 150 --budget-max 400

Expected success indicators:

- Unit tests report all passing.
- CLI output includes the sections `Chair Summary`, `Ergonomic Evaluation`, `Score`, `Impact on Body`, and `Recommended Alternatives` when score <= 7.

## Validation and Acceptance

Acceptance is met when:

- The CLI accepts exactly one of URL or description inputs and optional budget fields.
- Missing feature data triggers explicit assumptions in the report.
- The score is on a 1-10 scale with color-band interpretation (Red 1-4, Yellow 5-7, Green 8-10).
- If score <= 7, 2-4 alternatives are listed and prioritized within user budget where possible.
- `python -m unittest discover -s tests -v` passes.

## Idempotence and Recovery

All steps are safe to rerun. Re-running tests and CLI commands is non-destructive. If URL fetching fails, the tool degrades gracefully to best-effort text extraction warning and still reports based on available text.

## Artifacts and Notes

Expected report outline:

    Chair Summary
    - Input type: description
    - Extracted features: ...

    Ergonomic Evaluation
    - Spinal alignment: ...
    - Pressure distribution: ...

    Score
    - Overall: 4.9/10 (Yellow)

    Impact on Body
    - ...

    Recommended Alternatives
    - ...

## Interfaces and Dependencies

No third-party dependencies are required.

Public interfaces:

- `chair_eval.extractor.extract_features(source: str, is_url: bool) -> FeatureExtractionResult`
- `chair_eval.evaluator.evaluate(features: ChairFeatures) -> ErgonomicEvaluation`
- `chair_eval.recommendations.recommend_alternatives(current_eval: ErgonomicEvaluation, budget_min: Optional[int], budget_max: Optional[int], limit: int = 4) -> list[ChairOption]`
- `chair_eval.report.render_report(...) -> str`

Revision note (2026-03-22): Updated validation command to explicit `unittest discover` and recorded a lumbar keyword-order bug fix with regression test evidence.
