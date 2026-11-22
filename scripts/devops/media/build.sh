#!/usr/bin/env bash
# The images of the project (the gist MEDIAFILES, submodule resources/mediafiles) made into
# what pages and links show: favicons, icons of the web app manifest, the link card (og:image)
# and the extension's icons. Made once by hand and committed - builds need neither ffmpeg
# nor the submodule (phase 13).
#   lex-polonis.png                   (square)  -> favicons: the lynx's head below 64 px, the
#                                                  whole picture from 180 px up
#   p-jol-roll_edited-color.png       (16:9)    -> og.jpg, 1200x630, the card of a shared link
# Usage: build.sh   (needs ffmpeg; git submodule update --init resources/mediafiles)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
media="${MEDIA_DIR:-resources/mediafiles}"
square="$media/lex-polonis.png"
wide="$media/p-jol-roll_edited-color.png"
web=src/web/public          # the viewer: webapp-server, the demo; webpage/ takes it too
docs=docs/assets/images     # MkDocs
extension=src/firefox-ext/icons
# the lynx's head, where the whole picture is too small to read
head="crop=640:640:200:20"
navy="0x1d2440"

for file in "$square" "$wide"; do
  [ -f "$file" ] || { echo "$file is missing - git submodule update --init resources/mediafiles" >&2; exit 1; }
done
mkdir -p "$web" "$docs" "$extension"
ff() { ffmpeg -loglevel error -y "$@"; }
# big PNGs in 256 colours: the engraving keeps its look at a quarter of the weight
palette="split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse=dither=sierra2_4a"

# small: the head
for size in 16 32 48; do
  ff -i "$square" -vf "$head,scale=$size:$size:flags=lanczos" "$web/favicon-$size.png"
done
ff -i "$square" -vf "$head,scale=48:48:flags=lanczos" "$web/favicon.ico"
# big: the whole picture
ff -i "$square" -vf "scale=180:180:flags=lanczos,$palette" "$web/apple-touch-icon.png"
for size in 192 512; do
  ff -i "$square" -vf "scale=$size:$size:flags=lanczos,$palette" "$web/icon-$size.png"
done
# maskable: the picture inside the safe circle (80%), on the navy of its sky
ff -i "$square" -vf "scale=410:410:flags=lanczos,pad=512:512:51:51:color=$navy,$palette" "$web/icon-maskable-512.png"
# the card of a link: 1200x630, the title kept whole
ff -i "$wide" -vf "scale=1200:675:flags=lanczos,crop=1200:630:0:12" -q:v 6 "$web/og.jpg"

cp "$web/favicon-48.png" "$docs/favicon.png"
ff -i "$square" -vf "$head,scale=128:128:flags=lanczos" "$docs/logo.png"
for size in 48 96 128; do
  ff -i "$square" -vf "$head,scale=$size:$size:flags=lanczos" "$extension/icon-$size.png"
done
du -ch "$web"/favicon* "$web"/apple-touch-icon.png "$web"/icon-* "$web/og.jpg" "$docs"/*.png "$extension"/*.png | tail -n 1
echo "made: $web (favicons, icons, og.jpg), $docs, $extension"
