from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ChairFeatures:
    lumbar_support: str
    seat_depth: str
    seat_width: str
    cushioning: str
    backrest_height: str
    backrest_flexibility: str
    adjustability: str
    material: str
    headrest: str


@dataclass
class FeatureExtractionResult:
    features: ChairFeatures
    assumptions: list[str] = field(default_factory=list)
    source_text: str = ""


@dataclass
class ScoreBreakdownItem:
    category: str
    score: float
    max_score: float
    reason: str


@dataclass
class ErgonomicEvaluation:
    total_score: float
    band: str
    breakdown: list[ScoreBreakdownItem]
    principles: list[str]
    body_impact: list[str]


@dataclass
class ChairOption:
    name: str
    price_usd: int
    features: ChairFeatures
    value_note: str


@dataclass
class Recommendation:
    option: ChairOption
    score: float
    improvements: list[str]


@dataclass
class BudgetRange:
    min_usd: Optional[int]
    max_usd: Optional[int]
