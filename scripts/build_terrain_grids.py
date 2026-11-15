"""Build the two south-polar elevation grids that let the app compute real skylines for ANY
coordinates the user types in (src/core/terrain.js), not just the curated sites.

Inputs : data/raw/LDEM_85S_40M.IMG, data/raw/LDEM_60S_240M.IMG (scripts/fetch_dems.sh)
Outputs: public/data/terrain/elev_fine.bin    Int16 metres, 1264 x 1264, 240 m/px  (~±151 km, 85°S to pole)
         public/data/terrain/elev_coarse.bin  Int16 metres, 1250 x 1250, 960 m/px  (±600 km, distant horizon)
         public/data/terrain/meta.json        grid geometry
Heights are metres above the 1737.4 km reference sphere. Grids are polar stereographic about
the south pole, centred on it: row 0 = +y edge, col 0 = -x edge (same as NASA's LOLA products).

Run: .venv/bin/python scripts/build_terrain_grids.py
"""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from dem import PolarDEM  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "terrain"


def centre_block(h, centre, out_n, block):
    """Crop out_n*block pixels centred on the projection centre, then block-average."""
    span = out_n * block
    start = int(round(centre - (span - 1) / 2))
    assert start >= 0 and start + span <= h.shape[0], (start, span, h.shape)
    return h[start:start + span, start:start + span].reshape(out_n, block, out_n, block).mean(axis=(1, 3))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    raw = ROOT / "data" / "raw"
    fine_dem = PolarDEM(raw / "LDEM_85S_40M.IMG")
    fine = centre_block(fine_dem.h, fine_dem.line_off, 1264, 6)       # 40 m -> 240 m
    coarse_dem = PolarDEM(raw / "LDEM_60S_240M.IMG")
    coarse = centre_block(coarse_dem.h, coarse_dem.line_off, 1250, 4)  # 240 m -> 960 m
    (OUT / "elev_fine.bin").write_bytes(np.round(fine).astype("<i2").tobytes())
    (OUT / "elev_coarse.bin").write_bytes(np.round(coarse).astype("<i2").tobytes())
    (OUT / "meta.json").write_text(json.dumps({
        "fine": {"file": "elev_fine.bin", "n": 1264, "scale": 240.0},
        "coarse": {"file": "elev_coarse.bin", "n": 1250, "scale": 960.0},
        "source": "NASA LRO LOLA LDEM_85S_40M (block-averaged to 240 m) and LDEM_60S_240M (to 960 m)",
    }, indent=1))
    for f in sorted(OUT.iterdir()):
        print(f"  {f.name:16s} {f.stat().st_size / 1e6:5.2f} MB")


if __name__ == "__main__":
    main()
