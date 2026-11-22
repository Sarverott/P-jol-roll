# raw-law-of-poland

Raw files of Polish law as the public sources give them, gathered by
[P_JOL_ROLL](https://github.com/Sarverott/P-jol-roll) - one bucket for every
source, nothing changed in the files. The tables that describe them (and the
markdown made from them) are the dataset
[polish_national_law_docs](https://huggingface.co/datasets/Sarverott/polish_national_law_docs).

| Directory | Source | What is in it |
| --- | --- | --- |
| `DU/<year>/` | Dziennik Ustaw, [ELI API of Sejm](https://api.sejm.gov.pl/eli/openapi/) | every act by its address (`WDU20260000001`): `.json` details, `.references.json`, `.pdf`, `.html`, `.struct.json`, `.U.pdf` other texts |
| `MP/<year>/` | Monitor Polski, the same API | the same, addresses `WMP...` |
| `sejm/term<n>/` | [API of Sejm's work](https://api.sejm.gov.pl/sejm/openapi/) | `processes/<number>.json` legislative processes, `prints/<number>/<file>` drafts with their justifications |

Court judgments of [SAOS](https://www.saos.org.pl) come with their texts, so
they live in the dataset only (`SAOS/`). Every file is recorded with its
checksum in the dataset (`files/`) at the moment it was gathered.

- Code and how to gather it yourself: https://github.com/Sarverott/P-jol-roll
- Website of the project: https://sarverott.github.io/P-jol-roll/
- Documentation: https://lex-polonica.readthedocs.io/
- Demo, the acts browsed online: https://huggingface.co/spaces/Sarverott/docs-of-law-by-gov-in-poland
- Dataset: https://huggingface.co/datasets/Sarverott/polish_national_law_docs

The acts are public documents and are not protected by copyright (art. 4 of
the Polish copyright act). Gathered politely, two requests at a time, with
the project's own User-Agent.
