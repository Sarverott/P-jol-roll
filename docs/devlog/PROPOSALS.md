# PROPOSALS: ideas in debate

Ideas of anyone, numbered `PP<n>`, in three parts: DEFINE (what it is),
COMBINE (what it joins with here), CONCLUDE (what it would change). The owner
decides in [ORDERS.md](ORDERS.md) under `### PP<n>`; a decided proposal moves
into the changelog. The older ideas of
October 2026 are in [../.agents/ideas.md](../.agents/ideas.md).

---

PP1 was approved (changelog phase 1).

## PP2. Texts of acts that have only a PDF

*By Cleo, 2026-11-22.*

**DEFINE.** Of 165006 acts listed in `resources/dataset/acts/`, 39110 have
HTML and get markdown from `task text`; 125759 (76%) have only a PDF, and 137
have neither. A `task text -- --pdf` would take the text layer of each PDF
(pdf.js, already a dependency of the browser side, or `pdftotext`) into
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

## PP3. The images of the project on its pages

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
