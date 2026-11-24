# Phase 43: public tenders, local and regional law

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795536816187 · commit 7dc0662a

The order of phase 41 goes on: "To be interdisciplinary add government
contract tenders and any of important local and regional statements or
decisions." Built along the *Lean* of Q23 (issue #141):

- **Local and regional law** (`task regional`): the official journals of
  the sixteen voivodeships (`resources/configs/regional/journals.yaml`, from
  dziennikiurzedowe.gov.pl). Ten of them run one platform whose API answers
  as the Sejm's ELI API does, and give every act - over a million since
  2010; each journal's state is kept in `dataset/regional/journals.json`.
  On 2026-11-24 six did not answer as one: lubuskie, łódzkie and małopolskie
  with an incomplete chain of certificates (UNABLE_TO_VERIFY_LEAF_SIGNATURE),
  mazowieckie with a timeout, kujawsko-pomorskie and podlaskie on another
  platform - things for the declaration of transparency and the reports of
  phases 44-45. Lublin's 2026 taken here: 5,635 acts.
- **Public tenders** (`task tenders`): every notice of e-Zamówienia
  (Biuletyn Zamówień Publicznych) and the EU's TED notices with a buyer in
  Poland, by day. e-Zamówienia ignores its page number, so a window of time
  that comes back full is split in two until each half is whole; its
  firewall refused a burst of requests with 403 once, so requests go three
  seconds apart and a refusal is waited out.
- All of it in every interface: MCP `regional_law` and `tenders`,
  `/api/regional`, `/api/tenders`, the catalog.
