#!/usr/bin/env bash
# Visual check: builds the app, serves it, and screenshots every guided-tour scene plus the
# default view into review/ (gitignored). Open the PNGs to eyeball each scene.
# Needs Google Chrome installed. Usage: npm run screenshots
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=4179
OUT=review
mkdir -p "$OUT"
npx vite build >/dev/null
npx vite preview --port $PORT --strictPort >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
for _ in $(seq 1 30); do curl -s "localhost:$PORT" >/dev/null && break; sleep 0.3; done
PROFILE=$(mktemp -d)
shot() { # name url-query
  "$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
    --user-data-dir="$PROFILE" --window-size="${SIZE:-1600,900}" --virtual-time-budget=6000 \
    --screenshot="$OUT/$1.png" "http://localhost:$PORT/app.html$2" >/dev/null 2>&1
  echo "  $OUT/$1.png"
}
echo "Screenshots:"
shot 0-default ""
for n in 1 2 3 4 5 6 7 8; do shot "tour-$n" "?tour=$n"; done
shot help "?help=1"
SIZE=1280,720 shot small-720p "?tour=8"
rm -rf "$PROFILE"
