#!/usr/bin/env bash
# Regenerate the shippable raster icon set from the tile vector source.
# Single source of truth for the icon pipeline — the Nx `regenerate-icons`
# target and the README both point here, so the recipe never drifts.
#
# Requires: rsvg-convert (librsvg) + magick (ImageMagick).
#   macOS: brew install librsvg imagemagick
set -euo pipefail

# Run from the project root regardless of where the script is invoked.
cd "$(dirname "$0")/.."

DIR="icons/tile"
SRC="$DIR/vector-square.svg"   # full-bleed dark tile — the raster source

for s in 16 32 48 180 192 512; do
  rsvg-convert -w "$s" -h "$s" "$SRC" -o "$DIR/$s-dark.png"
done

# Multi-resolution .ico (16/32/48) for legacy favicon slots
magick "$DIR/16-dark.png" "$DIR/32-dark.png" "$DIR/48-dark.png" "$DIR/multi-dark.ico"

echo "✓ regenerated $DIR/ rasters from vector-square.svg"
