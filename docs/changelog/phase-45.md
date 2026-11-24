# Phase 45: reports to the authorities by mail

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795538406314 · commit 1042cbd7

The order of phase 41 goes on: "We want to make autoraporting mechanics by
mail to authorities like polish police, army, CBA, ABW, AW, CERT, NASK and
other like that." What is reported, and from which mailbox, is Q20 (issue
#138); built along its *Lean*, and nothing sent before the answer:

- **The authorities** (`resources/configs/reports/authorities.yaml`): CERT
  Polska, NASK, the Police's Central Cybercrime Bureau, ABW, CBA, AW and the
  Military Gendarmerie, each with the official contact read from its own
  page on 2026-11-24 (a named person's address never kept). CERT Polska's
  page names no address to read - its incident form instead - and the
  Gendarmerie's page did not answer: both to be confirmed.
- **Drafts** (`task report:draft`): the problems the project can check,
  each with its evidence, checked again when drafted. For now one kind: a
  public server whose certificates do not verify - the voivodeships'
  journals of phase 43. Three drafted here (lubuskie, łódzkie, małopolskie:
  a valid certificate served without its intermediate one), addressed to
  CERT Polska.
- **Sending** (`task report:send -- <draft>`): one draft shown whole, a
  person's yes asked at a terminal, then mailed from the owner's own mailbox
  (`REPORT_SMTP`, `REPORT_FROM` in `.env`) and kept with its Message-ID.
  No automatic sending: an agent drafts, a person sends. Not sent here.
