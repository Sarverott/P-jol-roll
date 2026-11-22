#!/usr/bin/env bash
# The examples of examples/notebooks/ (Jupyter, the source) turned into marimo notebooks in
# examples/marimo/, then, with "html", run and exported as static pages into site/examples/
# with an index - the website carries them (pages/build.sh). Running them reads the dataset
# and the bucket on Hugging Face, never the sources of the law.
# Usage: build.sh [html]   (needs uv)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
uvx=(uv run --quiet --project examples)

mkdir -p examples/marimo
for notebook in examples/notebooks/*.ipynb; do
  name=$(basename "$notebook" .ipynb)
  "${uvx[@]}" marimo convert "$notebook" -o "examples/marimo/$name.py"
done
echo "examples/marimo/: $(find examples/marimo -name "*.py" | wc -l) marimo notebooks"
[ "${1:-}" = html ] || exit 0

out=site/examples
mkdir -p "$out"
items=""
for notebook in examples/marimo/*.py; do
  name=$(basename "$notebook" .py)
  # a cell that fails (Hugging Face or the demo not answering) is shown failed on its page;
  # the website is published anyway
  "${uvx[@]}" marimo export html "$notebook" -o "$out/$name.html" -f \
    || echo "::warning::$name: some cells failed, the page shows which"
  # the title: the first heading of the notebook
  title=$(python3 -c 'import json, sys
cells = json.load(open(sys.argv[1]))["cells"]
print(next(line[2:].strip() for cell in cells for line in cell["source"] if line.startswith("# ")))' \
    "examples/notebooks/$name.ipynb")
  items+="<li><a href=\"$name.html\">${title:-$name}</a> · <a href=\"https://github.com/Sarverott/P-jol-roll/blob/development/examples/notebooks/$name.ipynb\">notebook</a></li>"
done
cat > "$out/index.html" <<HTML
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>P_JOL_ROLL examples</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem}a{color:#b4232c}</style>
</head><body>
<h1>Examples of P_JOL_ROLL from Python</h1>
<p>Jupyter notebooks of <a href="https://github.com/Sarverott/P-jol-roll/tree/development/examples">examples/</a>,
turned into <a href="https://marimo.io">marimo</a> and run when the website was built - the dataset and the bucket
on Hugging Face read as anyone can read them. <a href="../">Back to the project</a>.</p>
<ul>$items</ul>
</body></html>
HTML
echo "$out/: $(find "$out" -name "*.html" | wc -l) pages"
