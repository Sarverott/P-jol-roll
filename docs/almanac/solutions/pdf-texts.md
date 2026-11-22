# Texts of PDFs

Three of four acts have only a PDF. Their text comes from its text layer,
read by `pdftotext` of poppler (`src/core/parsing/pdf.ts`).

- Most old PDFs are scans with the recognised text of Adobe Paper Capture.
  It is kept uncorrected, and the producer goes into the record so a reader
  knows which texts these are.
- About 1 in 100 has no text layer at all: listed in
  `texts/<journal>/<year>.scans.jsonl`, waiting for OCR.
- A damaged PDF is listed there too, with poppler's complaint in `error`.
- Glyphs mapped to nothing come out as control characters; they are
  dropped, and a line made only of them goes away whole.
- A producer kept as UTF-16 without its mark is read back.

## Cases

- [A damaged PDF stops the whole text run](../cataclistics/damaged-pdf.md)
- [The producer of some PDFs reads as Chinese](../cataclistics/utf16-producer.md)
- [A markdown text taken for a binary file](../cataclistics/hub-binary-text.md)

See also [processing](../../guides/processing.md).
