# Reports to the authorities

Phase 45, the owner's order: reports by mail to the authorities - the
Police, the army, CBA, ABW, AW, CERT Polska, NASK. **An agent drafts, a
person sends**: nothing goes out without the owner reading it and saying
yes. What is reported and from which mailbox is Q20.

```bash
task report:draft                                          # the problems found, drafted with evidence
task report:send -- resources/reports/drafts/<draft>.md    # shown whole, a yes asked, then mailed
```

## The authorities

`resources/configs/reports/authorities.yaml` - official contacts only, each
read from the authority's own page, with the day it was read:

| Authority | Contact | Drafts |
| --- | --- | --- |
| CERT Polska (NASK) | the incident form, incydent.cert.pl - its address to be confirmed | `certificate` |
| NASK | nask@nask.pl | |
| Policja - Centralne Biuro Zwalczania Cyberprzestępczości | kontakt.cbzc@cbzc.policja.gov.pl | |
| ABW | poczta@abw.gov.pl | |
| CBA | bip@cba.gov.pl | |
| Agencja Wywiadu | poczta@aw.gov.pl | |
| Żandarmeria Wojskowa | its page did not answer - to be read again | |

## What is drafted

Only what the project can check, with its evidence, checked again when the
draft is made - a problem repaired since is not drafted:

- **certificate** - a public server whose chain of certificates does not
  verify. On 2026-11-24 three voivodeships' journals (lubuskie, łódzkie,
  małopolskie) served a valid certificate without its intermediate one:
  browsers fetch it themselves, programs reading the journal's API cannot.

A draft is `resources/reports/drafts/<date>-<kind>-<host>.md`: front matter
(to whom, what, the evidence), then the letter in Polish with how to check
it (`openssl s_client ...`).

## Sending

`task report:send` refuses without a terminal: a person's yes is asked
there, after the whole message is shown. It sends from the owner's own
mailbox - `REPORT_SMTP` (`smtps://user:password@host:465`) and
`REPORT_FROM` in `.env` - and keeps what was sent in `resources/reports/sent/`
with its Message-ID. An authority with no confirmed address is never sent
to.
