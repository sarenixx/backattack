from __future__ import annotations

import re
import urllib.error
import urllib.request
from html.parser import HTMLParser

from .models import ChairFeatures, FeatureExtractionResult


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []

    def handle_data(self, data: str) -> None:
        data = data.strip()
        if data:
            self._chunks.append(data)

    def text(self) -> str:
        return " ".join(self._chunks)


def _load_url_text(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; chair-evaluator/1.0)"
        },
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        content_type = resp.headers.get("Content-Type", "")
        body = resp.read(300_000)

    text = body.decode("utf-8", errors="ignore")
    if "html" in content_type.lower() or "<html" in text.lower():
        parser = _TextExtractor()
        parser.feed(text)
        return parser.text()
    return text


def _has_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


def extract_features(source: str, is_url: bool) -> FeatureExtractionResult:
    assumptions: list[str] = []
    raw_text = source

    if is_url:
        try:
            raw_text = _load_url_text(source)
        except (urllib.error.URLError, TimeoutError, ValueError):
            assumptions.append(
                "Could not fully fetch URL details; used available URL string as a fallback description."
            )
            raw_text = source

    text = raw_text.lower()

    if _has_any(text, [r"no lumbar", r"without lumbar", r"flat back"]):
        lumbar_support = "none"
    elif _has_any(text, [r"adjustable lumbar", r"dynamic lumbar", r"lumbar.*adjust"]):
        lumbar_support = "adjustable"
    elif _has_any(text, [r"lumbar", r"lower back support", r"built-in back support"]):
        lumbar_support = "fixed"
    else:
        lumbar_support = "fixed"
        assumptions.append("Lumbar support not specified; assumed fixed lumbar support.")

    if _has_any(text, [r"seat depth adjust", r"sliding seat", r"seat slider"]):
        seat_depth = "adjustable"
    elif _has_any(text, [r"deep seat", r"large seat depth", r"oversized seat"]):
        seat_depth = "deep"
    elif _has_any(text, [r"shallow seat", r"compact seat"]):
        seat_depth = "shallow"
    else:
        seat_depth = "standard"
        assumptions.append("Seat depth not specified; assumed standard depth.")

    if _has_any(text, [r"wide seat", r"extra wide", r"oversized"]):
        seat_width = "wide"
    elif _has_any(text, [r"narrow seat", r"slim seat"]):
        seat_width = "narrow"
    else:
        seat_width = "standard"
        assumptions.append("Seat width not specified; assumed standard width.")

    if _has_any(text, [r"high-density foam", r"memory foam", r"multi-layer foam"]):
        cushioning = "high"
    elif _has_any(text, [r"thin cushion", r"minimal padding", r"hard seat"]):
        cushioning = "low"
    else:
        cushioning = "medium"
        assumptions.append("Cushioning quality not specified; assumed medium cushioning.")

    if _has_any(text, [r"high back", r"full back", r"tall backrest"]):
        backrest_height = "high"
    elif _has_any(text, [r"mid back", r"medium back"]):
        backrest_height = "medium"
    elif _has_any(text, [r"low back"]):
        backrest_height = "low"
    else:
        backrest_height = "medium"
        assumptions.append("Backrest height not specified; assumed medium height.")

    if _has_any(text, [r"flexible back", r"dynamic back", r"synchro tilt", r"active back"]):
        backrest_flexibility = "high"
    elif _has_any(text, [r"rigid back", r"fixed back", r"stiff back"]):
        backrest_flexibility = "low"
    else:
        backrest_flexibility = "medium"
        assumptions.append("Backrest flexibility not specified; assumed medium flexibility.")

    adjust_hits = 0
    for pattern in [
        r"armrest", r"4d arm", r"tilt", r"recline", r"height adjust", r"seat height",
    ]:
        if re.search(pattern, text):
            adjust_hits += 1

    if adjust_hits >= 4:
        adjustability = "high"
    elif adjust_hits >= 2:
        adjustability = "medium"
    else:
        adjustability = "low"
        assumptions.append("Limited adjustability details found; assumed low-to-medium adjustability.")

    if _has_any(text, [r"mesh"]):
        material = "mesh"
    elif _has_any(text, [r"foam", r"fabric"]):
        material = "foam_fabric"
    elif _has_any(text, [r"leather", r"pu leather", r"faux leather"]):
        material = "leather"
    else:
        material = "foam_fabric"
        assumptions.append("Material not clearly specified; assumed foam/fabric blend.")

    if _has_any(text, [r"headrest", r"neck support"]):
        if _has_any(text, [r"adjustable headrest"]):
            headrest = "adjustable"
        else:
            headrest = "fixed"
    else:
        headrest = "none"

    features = ChairFeatures(
        lumbar_support=lumbar_support,
        seat_depth=seat_depth,
        seat_width=seat_width,
        cushioning=cushioning,
        backrest_height=backrest_height,
        backrest_flexibility=backrest_flexibility,
        adjustability=adjustability,
        material=material,
        headrest=headrest,
    )

    return FeatureExtractionResult(features=features, assumptions=assumptions, source_text=raw_text)
