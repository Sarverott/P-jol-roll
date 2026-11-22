# Phase 12: texts of acts that have only a PDF

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795326444111 · commit 1863721

The owner's message in the chat, 2026-11-22, after phase 11. It decides PP2
(phase 12) and PP3 (partly solved by the gist submodule `resources/mediafiles`,
committed on `dev/Sarverott`; the rest is phase 13), and asks for a friendlier
webapp (phase 14; embeddings are Q15). Word for word:

```text
okey so... i made that images part of submodule repository published as gist - we do not need more, gist will fit our needs here very well in my opinion. this makes PP3 partially solved, next there is scripts related with ffmpeg and mediafiles formating for building proper SEO-friendly web stuff like manifest and these "og:image" or favicons. your PP2 sounds great, you have my blessing. to add some more eye-friendly UI for webapp consider bulma for standarized formating layouts and for aside minimaps in the corner somewhere `Cytoscape.js`, for unified display of relations graphs with `mermaid.js`, for complex mapping of whole law of poland based on dataset and presettings `sigmajs` and some vector embedding maybe, for search mechanics `typesense` and i have no idea what else can we include here.
```

**Decision:** PP2 approved ("you have my blessing"). PP3 taken with the images
in the gist `MEDIAFILES` instead of copies in the repository; the scripts that
make icons, `og:image` and the manifest out of them follow in phase 13.

The two proposals as they stood when decided:

### PP2. Texts of acts that have only a PDF

*By Cleo, 2026-11-22.*

**DEFINE.** Of 165006 acts listed in `resources/dataset/acts/`, 39110 have
HTML and get markdown from `task text`; 125759 (76%) have only a PDF, and 137
have neither. A `task text -- --pdf` would take the text layer of each PDF
(`pdftotext` of poppler, or a library such as pdf.js - not a dependency yet) into
`dataset/texts/<journal>/<year>/<address>.md`, with the checksums of both
files, the same as the markdown from HTML; a PDF without a text layer (old
scans) would be named in a list, not guessed.

**COMBINE.** The training collection of M4 (phase 10 made the one dataset
for it), the remote demo (texts are read from the dataset page by page), and
the agent of the far goal, who cannot read three quarters of the law without
them. OCR of the scans is a later, separate step.

**CONCLUDE.** Phase 12: the text of every act that has any text, a list of
the scans, and the dataset holding about four times as many texts. It
needs the PDFs in the local bucket, so it runs where the owner gathered them.

### PP3. The images of the project on its pages

*By Cleo, 2026-11-22.*

**DEFINE.** The owner made images of the project (in
`~/__WORKSHOP/archive/inceptorium-apokryf/logo-images/`, among them
`p-jol-roll_edited-color_1280x720.png`, the journals of 1924-2024 in a line
with a reader). One of them, made smaller (WebP, under 200 kB), would go
into `webpage/public/` as the picture at the top of the main page and as its
`og:image`, so a link shared on social media shows it; the README and the
card of the demo space would show it too.

**COMBINE.** The posts for social media the owner prepared, the main page of
phase 10, the demo space. The social preview of the GitHub repository is a
setting, so it stays the owner's move.

**CONCLUDE.** Links to the project look the same everywhere they are shared.
Which image, and whether it may be published under the licence of the
repository, is the owner's word.

## UNIXUSAT=1795332045694 · commit fc57a7e

The owner's answers to Q15 and Q16 of BRAINSTORM.md, written in ORDERS.md
(commit on `dev/Sarverott`, merged in fc57a7e). Word for word:

````markdown
### Q15

after phase 12, a small local multilingual model. massive translations can be made with LibreTranslate engine - argostranslate. 

this will require codes in python so we can make them part of scripts that will produce us autotranslations linguistic packs, that will be used with i18n integrations for ducumentation, webpage of project, GUI, TUI and CLI manuals.

don't write all over again, instead of that and replacing texts with text loaders search text nodes and replace their content based on mapped SHA265 mapped listing of DOM hooks of elements - this is bare conceptual idea that i just came up with, so we have to check if my theoretical way is achievable with no mess in code.

all translations should be placed in `resources/locales/` dir as json files like `EN-US.json`. organization of language packs i left to you but all of them should be present listed in `resources/locales/.index.json` with defining default as "EN-US".



### Q16

i tried to parse these pdfs and push that, but unfortunately failed and throws error. also space is requiring updates that does not presented while i try to restart demo. 

we need all law files be markdowned and placed in dataset. idea with per-act markdown files sounds... actually good. this gives us possibility to deconstruct long docs and exclude duplicates of entries this way. if the limit is reduced count of how many commits we can push we can just push 128 pushes with 1000 files every hour, that is acceptable way. we can at least try.
````

**Decision on Q16:** texts stay a markdown file per act in the dataset; a
push goes in commits of 1000 files, at most 128 an hour (the push waits the
hour out by itself since phase 11). The owner's run of `task text -- --pdf`
stopped on a damaged PDF (DU/1932/38, zeros to its end) - fixed in phase 12;
the space keeps files of the marimo days because a push never deletes -
phase 15.

**Decision on Q15:** after phase 12, embeddings by a small local multilingual
model (phase 17). Translations by argostranslate (the engine of
LibreTranslate) from python scripts into language packs in
`resources/locales/`, listed in `resources/locales/.index.json` with EN-US
the default; applied to pages without rewriting them, through a SHA-256 map
of text nodes - the owner's idea, checked first for being possible without a
mess (phase 16).
