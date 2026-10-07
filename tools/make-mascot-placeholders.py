#!/usr/bin/env python3
"""Generate labeled placeholder SVGs for every mascot id.

Run from the repo root:  python3 tools/make-mascot-placeholders.py

Placeholders use the optional SVG contract in docs/mascot-svg-contract.md
(same viewBox, layer names and pivots) so the CSS and GSAP states can be
tested before final art exists. They have no blob or shadow: the mascot
component draws those, exactly as it will for raster art. Feet sit on the
shared ground line at 84% of the canvas height.
Re-running overwrites assets/mascots/placeholder/.
"""

import hashlib
from pathlib import Path

IDS = [
    "hero-bib-hand", "foam-finger", "power-button", "stopwatch", "magnifier",
    "megaphone", "clipboard", "lightbulb", "piggy-bank", "bullseye",
    "browser-window", "bar-chart", "handshake", "high-five", "podium",
    "compass", "baton", "ribbon", "green-flag", "glove-stop", "speech-bubble",
]

NAVY = "#1B2B4B"
AMBER = "#C8873A"
AMBER_LT = "#e0a558"
CREAM = "#F7F4EE"

# Three body silhouettes so neighbouring placeholders are easy to tell apart.
BODIES = [
    '<rect x="58" y="56" width="84" height="86" rx="26"/>',
    '<circle cx="100" cy="100" r="44"/>',
    '<rect x="62" y="50" width="76" height="94" rx="38"/>',
]

TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <title>{id} (placeholder)</title>
  <g id="leg-l">
    <rect x="80" y="136" width="11" height="32" rx="5.5" fill="{navy}"/>
  </g>
  <g id="leg-r">
    <rect x="109" y="136" width="11" height="32" rx="5.5" fill="{navy}"/>
  </g>
  <g id="arm-l">
    <path d="M62 100 Q44 106 38 126" stroke="{navy}" stroke-width="9" stroke-linecap="round"/>
  </g>
  <g id="arm-r">
    <path d="M138 100 Q156 106 162 126" stroke="{navy}" stroke-width="9" stroke-linecap="round"/>
  </g>
  <g id="body" fill="{fill}" stroke="{navy}" stroke-width="4">
    {body}
  </g>
  <g id="eyes" fill="{cream}" stroke="{navy}" stroke-width="3">
    <ellipse cx="86" cy="90" rx="9" ry="10"/>
    <ellipse cx="114" cy="90" rx="9" ry="10"/>
  </g>
  <g id="pupils" fill="{navy}">
    <circle cx="87" cy="92" r="4"/>
    <circle cx="115" cy="92" r="4"/>
  </g>
  <g id="mouth">
    <path d="M90 112 Q100 121 110 112" stroke="{navy}" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  <g id="marks" stroke="{navy}" stroke-width="3" stroke-linecap="round">
    <path d="M152 46 L162 38"/>
    <path d="M158 60 L171 57"/>
    <path d="M48 46 L38 38"/>
  </g>
  <g id="label">
    <text x="100" y="194" text-anchor="middle" font-family="'Libre Franklin', Arial, sans-serif" font-size="13" font-weight="600" fill="{navy}">{id}</text>
  </g>
</svg>
"""


def main():
    out = Path(__file__).resolve().parent.parent / "assets" / "mascots" / "placeholder"
    out.mkdir(parents=True, exist_ok=True)
    for mascot_id in IDS:
        n = int(hashlib.md5(mascot_id.encode()).hexdigest(), 16)
        svg = TEMPLATE.format(
            id=mascot_id,
            navy=NAVY,
            cream=CREAM,
            fill=AMBER if n % 2 else AMBER_LT,
            body=BODIES[n % len(BODIES)],
        )
        (out / f"{mascot_id}.svg").write_text(svg)
    print(f"Wrote {len(IDS)} placeholders to {out}")


if __name__ == "__main__":
    main()
