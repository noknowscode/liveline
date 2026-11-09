#!/bin/sh
# Renders every Liveline banner: 1x (1200 x 630) and 2x (2400 x 1260) from the same composition, and the two heroes
# (1920 x 1080): focus-badge and stylized-seeds (by the owner's brief change, stylized-split has none).
# Run from src/ with NODE_PATH reaching playwright:  NODE_PATH=$(npm root -g) sh tools/render-all.sh [outdir]
set -e
OUT=${1:-../finals}
B="showcase-desk showcase-phones showcase-daynight focus-badge focus-easing focus-card focus-line stylized-split stylized-seeds stylized-motion focus-badge-titled"
args=""
for n in $B; do args="$args $n.html $OUT/$n@1x.png 1200 630 1 $n.html $OUT/$n@2x.png 1200 630 2"; done
args="$args focus-badge-hero.html $OUT/focus-badge-hero.png 1920 1080 1 stylized-seeds-hero.html $OUT/stylized-seeds-hero.png 1920 1080 1"
node tools/render.js $args
