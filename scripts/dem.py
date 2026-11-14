"""Reader for NASA LOLA polar-stereographic DEMs (PDS3 .IMG + .LBL).

Height convention (from the PDS label):  height_m = DN * SCALING_FACTOR
relative to a 1737.4 km reference sphere.
"""
import re
from pathlib import Path

import numpy as np

R_M = 1737400.0


class PolarDEM:
    def __init__(self, img_path):
        img_path = Path(img_path)
        lbl = img_path.with_suffix(".LBL").read_text(errors="ignore")
        num = lambda key: float(re.search(rf"\b{key}\s*=\s*([-\d.]+)", lbl).group(1))
        self.n = int(num("LINES"))
        self.scale_m = num("MAP_SCALE")
        self.line_off = num("LINE_PROJECTION_OFFSET")
        self.samp_off = num("SAMPLE_PROJECTION_OFFSET")
        self.factor = num("SCALING_FACTOR")
        raw = np.memmap(img_path, dtype="<i2", mode="r", shape=(self.n, self.n))
        self.h = raw.astype(np.float32) * self.factor  # metres above 1737.4 km sphere
        self.name = img_path.stem

    # Polar stereographic, south pole (PDS LOLA convention):
    #   x = 2R tan(pi/4 + lat/2) sin(lon),  y = 2R tan(pi/4 + lat/2) cos(lon)
    #   sample = x/scale + SAMPLE_OFFSET,    line = LINE_OFFSET - y/scale   (0-based)
    # Orientation verified against Shackleton crater (deep bowl near the pole) and
    # Malapert massif (+5 km peak at lon 0) — see docs/PROGRESS_LOG.md.
    def latlon_to_pix(self, lat, lon):
        lat = np.radians(lat)
        lon = np.radians(lon)
        rho = 2 * R_M * np.tan(np.pi / 4 + lat / 2)
        x, y = rho * np.sin(lon), rho * np.cos(lon)
        return self.line_off - y / self.scale_m, x / self.scale_m + self.samp_off

    def sample(self, lat, lon):
        """Bilinear height (m) at lat/lon arrays; NaN outside coverage."""
        li, si = self.latlon_to_pix(np.asarray(lat, float), np.asarray(lon, float))
        ok = (li >= 0) & (si >= 0) & (li < self.n - 1) & (si < self.n - 1)
        out = np.full(li.shape, np.nan, dtype=np.float32)
        l0 = np.floor(li[ok]).astype(int)
        s0 = np.floor(si[ok]).astype(int)
        fl, fs = li[ok] - l0, si[ok] - s0
        h = self.h
        out[ok] = (h[l0, s0] * (1 - fl) * (1 - fs) + h[l0 + 1, s0] * fl * (1 - fs)
                   + h[l0, s0 + 1] * (1 - fl) * fs + h[l0 + 1, s0 + 1] * fl * fs)
        return out


class DEMStack:
    """Samples the highest-resolution DEM that covers each point."""

    def __init__(self, dems):
        self.dems = dems  # finest first

    def sample(self, lat, lon):
        lat = np.asarray(lat, float)
        out = np.full(lat.shape, np.nan, dtype=np.float32)
        for d in self.dems:
            miss = np.isnan(out)
            if not miss.any():
                break
            out[miss] = d.sample(lat[miss], np.asarray(lon, float)[miss] if np.ndim(lon) else lon)
        return out
