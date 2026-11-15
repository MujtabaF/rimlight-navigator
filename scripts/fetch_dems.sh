#!/usr/bin/env bash
# Downloads the NASA LRO LOLA elevation maps used by build_horizons.py (~270 MB, gitignored):
#  - LDEM_85S_40M, LDEM_60S_240M: south-polar maps (40 m and 240 m)
#  - LDEM_16: global map (16 px/deg, ~1.9 km) for sites outside the polar maps
# Source: PDS Geosciences Node mirror at MIT (imbrium.mit.edu).
set -euo pipefail
cd "$(dirname "$0")/../data" && mkdir -p raw && cd raw
get() { # base-url file
  for ext in LBL IMG; do
    [ -f "$2.$ext" ] || curl -fL --retry 3 -C - -o "$2.$ext" "$1/$2.$ext"
  done
}
for f in LDEM_85S_40M LDEM_60S_240M; do get https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG "$f"; done
get https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG LDEM_16
ls -lh
