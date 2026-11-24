# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

Q15 and Q16 were answered (changelog phase 12), Q17 and Q18 (changelog phase 22), Q19
(changelog phase 25). Open: Q20-Q24 (asked in phase 41).

## Q20. Reports to the authorities: what is reported, by whom, from where

The order of phase 41: "autoraporting mechanics by mail to authorities like
polish police, army, CBA, ABW, AW, CERT, NASK". The mechanics are clear - a
report drafted, a person reads it, it is sent - but not what the project
would report: a security problem of a government service it reads (an
expired certificate, an exposed file, a page changed by someone else)? a
breach of law the analysis finds? something else? And from which mailbox,
signed how, in which language.

*Lean:* only what can be checked and is the project's to see - security
problems of the public services it reads - to CERT Polska (incident form
or cert@cert.pl) and NASK; drafted by an agent with the evidence, sent only
after the owner reads each one and says yes, from a mailbox of the owner
(its SMTP in `.env`), in Polish, signed with the owner's FIDO key of phase
40. The Police, the army (Żandarmeria Wojskowa), CBA, ABW and AW listed in
the directory of phase 44 with their official channels, and reported to
only when the owner names what belongs to them. Phase 45 builds the drafts
and the approval before the answer; nothing is sent until it.

## Q21. The accounts of the mirrors and of the channels

Phases 46 and 47 put the repository on GitLab, Bitbucket, sourcehut,
Gitea.com and a Gitea of our own, and the announcements on Tumblr, X,
Blogger, Telegram, Discord and Mastodon. Each needs an account and a token
of the owner's.

*Lean:* the owner makes the accounts (`Sarverott` where the name is free)
and puts each token as a secret of the repository - `GITLAB_TOKEN`,
`BITBUCKET_TOKEN`, `SOURCEHUT_TOKEN`, `GITEA_TOKEN`, `TUMBLR_*`,
`X_*`, `BLOGGER_*`, `TELEGRAM_BOT_TOKEN` with `TELEGRAM_CHAT`,
`DISCORD_WEBHOOK`, `MASTODON_TOKEN` with `MASTODON_INSTANCE`; every
workflow does its part when its secret is there and says it skipped when it
is not. Which Mastodon instance, which Discord server and channel, which
Telegram channel: the owner's.

## Q22. Which international law

The order: "international sets of laws that are adopted by Poland". The law
of the EU alone is hundreds of thousands of acts; the treaties of the UN,
the Council of Europe and others bind Poland too.

*Lean:* (1) the law of the EU in force in Polish - regulations, directives,
decisions and the treaties - from EUR-Lex (its SPARQL endpoint and its
texts), into `dataset/EU` and `bucket/EU`, by year as the journals are;
(2) the international agreements binding Poland: those published in
Dziennik Ustaw are here already (marked as such), with their status taken
from the UN Treaty Collection and the Council of Europe's Treaty Office.
Case law of the CJEU and the ECtHR later.

## Q23. Which tenders and which local law

The order: "government contract tenders and any of important local and
regional statements or decisions".

*Lean:* tenders: every notice of the Biuletyn Zamówień Publicznych
(e-Zamówienia's open API) and the notices of TED for Poland, by month.
Local and regional law: every act of the sixteen voivodeships' official
journals (`edziennik.<voivodeship>.gov.pl`: resolutions of communes,
districts and regions, orders of voivodes) - all of it, as the journals of
the state are, rather than a choice of "important" ones, which no one could
make fairly; the analysis and the mastermind then find what matters.

## Q24. The declaration of transparency: how far

The order: "all gov offices emails for official contact data with phones
and addresses, including OpenStreetMap pinning of coords of places,
government IPs and other like that".

*Lean:* institutions only - every public office of the registers (the
directory of ePUAP and the official lists of dane.gov.pl, TERYT for places)
with its official e-mail, phone, address and ePUAP box, as the institution
publishes them; its coordinates from OpenStreetMap (Nominatim, one request
a second, with attribution); the address space of the state: the networks
(prefixes, AS numbers) registered to Polish public institutions in RIPE,
and the domains under gov.pl. No named person's private data beyond what
an office publishes as its own contact. Published as a dataset and a map.
"Other like that": the owner's to name.

