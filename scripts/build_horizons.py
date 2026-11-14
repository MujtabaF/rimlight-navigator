"""Precompute terrain horizon masks + 3D terrain patches for curated sites.

Inputs : data/raw/LDEM_85S_40M.IMG, data/raw/LDEM_60S_240M.IMG  (NASA LOLA, PDS)
         src/data/sites.json
Outputs: public/data/sites/<id>.json   horizon mask (720 azimuths, 0.5 deg step)
         public/data/sites/<id>.bin    Int16 heightmap (metres, relative to site), N x N,
                                       row 0 = north edge, col 0 = west edge

Run:   .venv/bin/python scripts/build_horizons.py

Horizon method: for every azimuth, march outward along a great circle from 40 m to
300 km (geometric spacing), sample terrain, and take the maximum elevation angle
including lunar curvature:
    el = atan2((R+ht)cos(theta) - (R+h0), (R+ht) sin(theta)),  theta = d / R
No atmosphere -> no refraction.
"""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from dem import R_M, DEMStack, PolarDEM  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "sites"
OBSERVER_HEIGHT_M = 2.0  # roughly a lander deck / solar panel height
AZ_STEP = 0.5
PATCH_N = 513  # grid points per side
PATCH_WARP = 0.25  # grid spacing: ~29 m at the centre (matches the 40 m DEM), ~290 m at the edges
PATCH_HALF_M = 30000  # 60 km x 60 km terrain patch


def destination(lat, lon, az, d):
    """Great-circle destination (deg) from lat/lon (deg), az (deg), distance d (m)."""
    p1, l1, a, t = np.radians(lat), np.radians(lon), np.radians(az), d / R_M
    p2 = np.arcsin(np.sin(p1) * np.cos(t) + np.cos(p1) * np.sin(t) * np.cos(a))
    l2 = l1 + np.arctan2(np.sin(a) * np.sin(t) * np.cos(p1), np.cos(t) - np.sin(p1) * np.sin(p2))
    return np.degrees(p2), (np.degrees(l2) + 540) % 360 - 180


def snap_to_high(dem, lat, lon, radius_m):
    az = np.arange(0, 360, 5.0)
    d = np.linspace(0, radius_m, 40)
    A, D = np.meshgrid(az, d)
    la, lo = destination(lat, lon, A.ravel(), D.ravel())
    h = dem.sample(la, lo)
    i = int(np.nanargmax(h))
    return float(la[i]), float(lo[i])


def horizon_mask(dem, lat, lon, h0):
    az = np.arange(0, 360, AZ_STEP)
    d = 40.0 * 1.01 ** np.arange(0, 900)
    d = d[d <= 300000]
    A, D = np.meshgrid(az, d, indexing="ij")
    la, lo = destination(lat, lon, A.ravel(), D.ravel())
    ht = dem.sample(la, lo).reshape(A.shape)
    theta = D / R_M
    r0 = R_M + h0 + OBSERVER_HEIGHT_M
    rt = R_M + ht
    el = np.degrees(np.arctan2(rt * np.cos(theta) - r0, rt * np.sin(theta)))
    el = np.where(np.isnan(el), -90, el)
    idx = np.argmax(el, axis=1)
    return az, el.max(axis=1), d[idx]


def terrain_patch(dem, lat, lon, h0):
    # Non-uniform grid: x = half * (a*u + (1-a)*u^3), u in [-1, 1]. Dense where the camera
    # looks (the landing spot), coarse at the edges. src/scene.js applies the same warp.
    u = np.linspace(-1, 1, PATCH_N)
    xs = PATCH_HALF_M * (PATCH_WARP * u + (1 - PATCH_WARP) * u ** 3)
    X, Y = np.meshgrid(xs, xs[::-1])  # row 0 = north
    az = np.degrees(np.arctan2(X, Y))
    d = np.hypot(X, Y)
    la, lo = destination(lat, lon, az.ravel(), d.ravel())
    h = dem.sample(la, lo).reshape(X.shape) - h0
    return np.nan_to_num(h, nan=0).round().clip(-32000, 32000).astype("<i2")


def main():
    raw = ROOT / "data" / "raw"
    dem = DEMStack([PolarDEM(raw / "LDEM_85S_40M.IMG"), PolarDEM(raw / "LDEM_60S_240M.IMG")])
    sites = json.loads((ROOT / "src" / "data" / "sites.json").read_text())["sites"]
    OUT.mkdir(parents=True, exist_ok=True)
    for s in sites:
        lat, lon = s["lat"], s["lon"]
        if lat > -60:
            continue  # outside south-polar DEM coverage -> app uses smooth-sphere horizon
        if s.get("snap"):
            lat, lon = snap_to_high(dem, lat, lon, s["snap"])
        h0 = float(dem.sample(np.array([lat]), np.array([lon]))[0])
        az, el, dist = horizon_mask(dem, lat, lon, h0)
        patch = terrain_patch(dem, lat, lon, h0)
        (OUT / f"{s['id']}.bin").write_bytes(patch.tobytes())
        (OUT / f"{s['id']}.json").write_text(json.dumps({
            "id": s["id"], "lat": round(lat, 5), "lon": round(lon, 5), "heightM": round(h0, 1),
            "azStep": AZ_STEP, "horizonEl": [round(float(v), 3) for v in el],
            "horizonDistKm": [round(float(v) / 1000, 2) for v in dist],
            "patch": {"n": PATCH_N, "halfSizeM": PATCH_HALF_M, "warp": PATCH_WARP, "file": f"{s['id']}.bin"},
            "source": "NASA LRO LOLA LDEM_85S_40M + LDEM_60S_240M (PDS Geosciences / MIT imbrium)",
        }))
        print(f"{s['id']:18s} lat {lat:9.4f} lon {lon:9.4f}  h {h0:7.0f} m  "
              f"horizon min {el.min():5.2f}  max {el.max():5.2f} deg")


if __name__ == "__main__":
    main()
