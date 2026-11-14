#!/usr/bin/env bash
# Downloads the NASA LRO LOLA south-polar elevation maps used by build_horizons.py (~235 MB).
# Source: PDS Geosciences Node mirror at MIT (imbrium.mit.edu).
set -euo pipefail
cd "$(dirname "$0")/../data" && mkdir -p raw && cd raw
BASE=https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG
for f in LDEM_85S_40M LDEM_60S_240M; do
  for ext in LBL IMG; do
    [ -f "$f.$ext" ] || curl -fL -o "$f.$ext" "$BASE/$f.$ext"
  done
done
ls -lh
