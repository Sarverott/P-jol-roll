---
title: Docs Of Law By Gov In Poland
emoji: 🍃
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
# the demo's AI on the visitor's own token (phase 32): signing in with Hugging Face
hf_oauth: true
hf_oauth_expiration_minutes: 480
hf_oauth_scopes:
  - inference-api
pinned: true
license: cc-by-sa-4.0
short_description: crawling across the entries, download them and read all laws
---

# P_JOL_ROLL - the demo

Every act of the Polish journals of laws - Dziennik Ustaw since 1918,
Monitor Polski since 1930 - to browse, served by P_JOL_ROLL's own
`webapp-server`: the website, and the api under `/api` (described at
`/openapi.json`).

It takes nothing in advance: each page reads only what it shows from the
dataset
[Sarverott/polish_national_law_docs](https://huggingface.co/datasets/Sarverott/polish_national_law_docs)
(the acts of a year, one act's details and its markdown), and the PDF and
HTML of an act open straight from the bucket.

- the project: https://github.com/Sarverott/P-jol-roll
- the introduction: https://sarverott.github.io/P-jol-roll/
- raw files of every act: https://huggingface.co/buckets/Sarverott/raw-law-of-poland

Not (formally) legal advices.

The image is `ghcr.io/sarverott/p-jol-roll-webapp-server`, made by every
release of the project; the space's variable `P_JOL_ROLL_VERSION` names the
release it is built from, and every release sets it and builds the space
again. These files are kept in git, in `resources/configs/space/` of the
project, and every release brings them here. To try it at home:

```sh
docker build -t p-jol-roll-demo . && docker run --rm -p 7860:7860 p-jol-roll-demo
```
