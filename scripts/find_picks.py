"""Find "Rimlight picks": ideal south-pole landing spots, from NASA's own LOLA products.

Score for every 120 m cell (85°S to the pole):
    sunlight x (0.4 + 0.6 x Earth visibility) x safe slope x ice nearby
  - sunlight, Earth visibility: LOLA team long-term averages (AVGVISIB 60 m, 2016 release)
  - safe slope: 1 below 8 deg, falling to 0 at 15 deg (from LDEM_85S_40M)
  - ice nearby: 1 if a permanently shadowed region (LPSR) is within 1-5 km, less further away,
    0 inside one (you can't power a lander in permanent shadow)
Keeps the best spots at least 12 km apart and prints them. The app then re-checks each pick
with its own horizon and ephemeris (scripts/build_horizons.py + the landing planner).

Inputs: data/raw/ (scripts/fetch_dems.sh plus the illumination products listed below).
Run:    .venv/bin/python scripts/find_picks.py
"""
import re
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
import json

from dem import R_M, DEMStack, PolarDEM  # noqa: E402

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"


def read(name):
    lbl = (RAW / f"{name}.LBL").read_text(errors="ignore")
    num = lambda k: float(re.search(rf"\b{k}\s*=\s*([-\d.]+)", lbl).group(1))
    n = int(num("LINES"))
    off = re.search(r"^\s*OFFSET\s*=\s*([-\d.]+)", lbl, re.M)
    a = np.memmap(RAW / f"{name}.IMG", dtype="<i2", mode="r", shape=(n, n)).astype(np.float32)
    return a * num("SCALING_FACTOR") + (float(off.group(1)) if off else 0.0), n, num("MAP_SCALE")


def block(a, k, how="mean"):
    n = (a.shape[0] // k) * k
    b = a[:n, :n].reshape(n // k, k, n // k, k)
    return b.max(axis=(1, 3)) if how == "max" else b.mean(axis=(1, 3))


def main(count=6, sep_km=12.0, mode='balanced'):
    sun, n, s = read("AVGVISIB_85S_060M_201608")
    earth, _, _ = read("AVGVISIB_85S_060M_201608_EARTH")
    psr, _, _ = read("LPSR_85S_060M_201608")
    K = 2  # 60 m -> 120 m cells
    sun, earth, psr = block(np.clip(sun, 0, 1), K), block(np.clip(earth, 0, 1), K), block(psr, K)
    cs = s * K
    m = sun.shape[0]
    c = (n - 1) / 2 / K - 0.25  # projection centre in the reduced grid

    dist_km = ndimage.distance_transform_edt(psr < 0.5) * cs / 1000
    ice = np.where(dist_km <= 0.3, 0.0, np.where(dist_km <= 5, 1.0, np.clip(1 - (dist_km - 5) / 15, 0.3, 1)))
    # 'balanced': power and Earth contact; 'power': sunlight first (Earth only as a tie-breaker)
    score = sun * (0.4 + 0.6 * earth) * ice if mode == 'balanced' else sun ** 2 * (0.85 + 0.15 * earth) * ice

    # slope only for promising cells (cheap): sample the 40 m DEM around each
    dem = DEMStack([PolarDEM(RAW / "LDEM_85S_40M.IMG"), PolarDEM(RAW / "LDEM_60S_240M.IMG")])
    cand = np.argsort(score, axis=None)[::-1][:6000]
    rows, cols = np.unravel_index(cand, score.shape)
    x = (cols - c) * cs
    y = (c - rows) * cs

    def latlon(x, y):
        rho = np.hypot(x, y)
        return np.degrees(2 * np.arctan(rho / (2 * R_M)) - np.pi / 2), np.degrees(np.arctan2(x, y))

    def h_at(xx, yy):
        la, lo = latlon(xx, yy)
        return dem.sample(la, lo)

    d = 60.0
    dzdx = (h_at(x + d, y) - h_at(x - d, y)) / (2 * d)
    dzdy = (h_at(x, y + d) - h_at(x, y - d)) / (2 * d)
    slope = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
    safe = np.clip((15 - slope) / 7, 0, 1)
    final = np.nan_to_num(score.ravel()[cand] * safe, nan=0.0)
    # skip spots within 8 km of a site the app already has (we want new places)
    have = json.loads((RAW.parent.parent / "src/data/sites.json").read_text())["sites"]
    for h in have:
        if h["lat"] > -80:
            continue
        rho = 2 * R_M * np.tan(np.pi / 4 + np.radians(h["lat"]) / 2)
        hx, hy = rho * np.sin(np.radians(h["lon"])), rho * np.cos(np.radians(h["lon"]))
        final[np.hypot(x - hx, y - hy) < 8000] = 0

    picks = []
    for i in np.argsort(final)[::-1]:
        if final[i] <= 0:
            break
        if all(np.hypot(x[i] - p["x"], y[i] - p["y"]) > sep_km * 1000 for p in picks):
            la, lo = latlon(x[i], y[i])
            picks.append(dict(x=x[i], y=y[i], lat=float(la), lon=float(lo), score=float(final[i]),
                              sun=float(sun.ravel()[cand[i]]), earth=float(earth.ravel()[cand[i]]),
                              ice_km=float(dist_km.ravel()[cand[i]]), slope=float(slope[i])))
        if len(picks) == count:
            break
    for k, p in enumerate(picks, 1):
        print(f"{k}. lat {p['lat']:9.4f} lon {p['lon']:9.4f}  score {p['score']:.3f}  sun {p['sun']*100:4.1f}%  "
              f"earth {p['earth']*100:4.1f}%  ice {p['ice_km']:4.1f} km  slope {p['slope']:4.1f} deg")
    return picks


if __name__ == "__main__":
    print("Balanced (power + Earth contact):"); main(5)
    print("Most power:"); main(5, mode='power')
