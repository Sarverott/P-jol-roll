# P_JOL_ROLL glossary

> Words used in the code and the docs, each with one meaning. Polish terms
> of the source are kept in Polish, because that is how they appear in the
> data.

## The source

| Word | Meaning |
| --- | --- |
| Act | One position of a journal: a statute, a regulation, an announcement and so on. The unit everything here is counted in. |
| Journal (publisher) | An official journal that publishes acts. Two are gathered: `DU` and `MP`. The API calls it `publisher`. |
| Dziennik Ustaw (`DU`) | Journal of Laws of the Republic of Poland: statutes, regulations, treaties. Since 1918. |
| Monitor Polski (`MP`) | Official Gazette: resolutions, orders, announcements, decisions. Since 1930. |
| ELI | European Legislation Identifier, a common way of addressing law in Europe. Here: `DU/2026/1`, meaning journal, year, position. |
| ELI API | The open API of Sejm at `api.sejm.gov.pl/eli` that this project gathers from. |
| Address | The source's own id of an act, such as `WDU20260000001`. Files are named by it. |
| Display address | The citation lawyers use: `Dz.U. 2026 poz. 1`. |
| Position (`pos`) | Number of the act within its year. |
| ISAP | Internetowy System Aktów Prawnych, the website of Sejm that shows the same acts to people. |

## Kinds and states of acts

| Word | Meaning |
| --- | --- |
| Type | What kind of act it is: `Ustawa` (statute), `Rozporządzenie` (regulation), `Obwieszczenie` (announcement) and others. Listed in `document_types.json`. |
| Status | What the source says about the act's standing: `obowiązujący` (in force), `uchylony` (repealed), `akt jednorazowy` (one-time act) and others. Listed in `statuses.json`. |
| Tekst jednolity | Consolidated text: an act republished with all its amendments worked in. The usual place to read the current wording. |
| Reference | A tie from one act to another, of a named kind: legal basis, amendment, repeal, executive act and so on. Kinds are in `reference_types.json`. |

## Gathering

| Word | Meaning |
| --- | --- |
| Gathering | One run of `gather`: lists, listings and, when asked, files of acts. |
| Index | The answer of `GET /`: names and addresses of everything the API gives. The gatherer follows it. |
| List | A small table of the API that describes the rest: statuses, types, keywords, institutions, journals. |
| Listing | Metadata of every act of one year of one journal, in one file. |
| Part | One of the files of an act: `details`, `references`, `pdf`, `html`. |
| Limit | How many acts one run takes files for. |
| Rate | Requests per minute. |

## Checkup

| Word | Meaning |
| --- | --- |
| Frontend | A website that shows acts to people. Listed in `resources/frontends.json`. |
| Checkup | One run of the browser over frontends for gathered acts. |
| Visit | One page opened once: one line of a checkups file. |
| Camoufox | The browser used for visits: a Firefox build that looks like an ordinary visitor. |

## Keeping

| Word | Meaning |
| --- | --- |
| Resources | The directory `resources/`: local sides of the repositories on Hugging Face. Ignored by git. |
| Dataset | Tables: lists, listings, checkups. A dataset repository on Hugging Face. |
| Bucket | Raw files of acts. Object storage on Hugging Face. |
| Space | The application on Hugging Face that will show the data. Empty for now. |
| Map | `resources/.map.json`: which local directory belongs to which repository. |
| Plan | The comparison of a local directory with its repository: upload, changed, download, same. |
| `.part` | A file still being written. It gets its real name when complete. |

## The project

| Word | Meaning |
| --- | --- |
| Devlog | `docs/devlog/`: scrapnotes with the plan and progress, named `scrapnote-<UNIXUSAT>.md`. |
| NOTE / ANSWER | A task left by the maintainer as a comment, and the reply under it. |
| Agent | An AI model working in the repository under `AGENTS.md`. |
