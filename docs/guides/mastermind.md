# The law mastermind

The first voice of the law mastermind (phase 30; the owner's plan in
[Q18](https://github.com/Sarverott/P-jol-roll/wiki/Devlog-VISION)): a
question in words, answered by a model that reads the acts through the
project's own MCP tools and cites every act it leans on by its ELI.
**Not legal advice**: a devil's advocate everyone can afford.

## How it answers

1. **The acts nearest by meaning.** The question becomes a vector of the
   model that made the vectors of `task embed` (bge-m3), and the MCP tool
   `search_meaning` compares it with the vector of every act of every year.
2. **Their texts.** The texts of the nearest three (`act_text`) are read and
   given to the model with the question.
3. **Rounds.** The model may call any tool - `act`, `act_text`,
   `search_acts`, `search_meaning`, ... - for at most six rounds, then
   answers.
4. **The citations checked.** Every `[DU/<year>/<position>]` of the answer
   is marked `read` when the model opened that act through a tool, and *not
   read* when it named it from memory.

## On this machine: the host's Ollama

Development uses the Ollama of the host (`http://127.0.0.1:11434`) and its
GPU, with `deepseek-r1:8b` and `bge-m3` pulled into it:

```bash
task mastermind:ask -- "Kto płaci podatek dochodowy od osób fizycznych?"
task mastermind:ask -- --json "..."        # with the reasoning and the tools it called
MASTERMIND_URL=http://127.0.0.1:11434 task serve
curl -G http://127.0.0.1:8080/api/ask --data-urlencode "question=..."
```

## On another machine: compose

The profile `mastermind` brings everything as containers: `llms-ollama`,
`llms-models` (pulls the models once, then ends), and `mastermind` - the
image of webapp-server with a mastermind set, serving `/api/ask`, `/mcp` and
the viewer on `127.0.0.1:8081`.

```bash
task resources:pull -- dataset             # the acts and their vectors (dataset/embeddings/)
task mastermind:up                         # the GPU given to Ollama when nvidia-smi answers
docker compose logs -f llms-models         # the first start downloads about 6 GB
curl -G http://127.0.0.1:8081/api/ask --data-urlencode "question=..."
task mastermind:down
```

By hand: `docker compose --profile mastermind up -d`, and
`-f compose.yaml -f resources/services/gpu.yaml` before `--profile` for the
NVIDIA cards (the NVIDIA Container Toolkit is needed for them).

## The advanced strategy: a deepseek hosted by Hugging Face

The owner's plan (Q18, phase 34): small models on the host first, the hard
questions to a large deepseek hosted by Hugging Face. `src/mastermind/strategy.ts`:

- **`--escalate`**: the usual model answers first; its answer goes on when it
  is weak - it says nothing, cites no act, or cites an act it never opened.
  The large one, `deepseek-ai/DeepSeek-R1-0528` through Inference Providers
  (`https://router.huggingface.co/v1`; novita, deepinfra and featherless-ai
  serve it), gets the small one's answer to check, never to trust, and
  reads the acts itself through the same MCP tools.
- **`--hard`**: straight to it.

```bash
task mastermind:ask -- --escalate "Czy mogę odliczyć ulgę na dziecko po rozwodzie?"
task mastermind:ask -- --hard "..."
curl -G http://127.0.0.1:8080/api/ask --data-urlencode "question=..." -d escalate=1
```

Here it is paid by `HF_TOKEN` of `.env` - the owner's own, so only a
question the owner asks spends it; on the space by the signed-in visitor's
token. The chat shows a switch *a hard question* when the host can pay for
it (`hard` of `/api/ask/about`), and folds what the smaller model said first.
The large one's conversation is kept with `escalated`: the small model, why
its answer went on, what it said and where that is kept.

| Variable | Default | What it is |
| --- | --- | --- |
| `HARD_MODEL` | `deepseek-ai/DeepSeek-R1-0528` | the model of hard questions |
| `HARD_URL` | `https://router.huggingface.co/v1` | its OpenAI-like api |
| `HARD_KEY` | `HF_TOKEN` | the token it is paid by |

Not yet seen answering for real: Inference Providers refuse the owner's
token with 402 until it has credits (phase 32); it is tested against a
stand-in of them.

## The Python stack

The models and the simulations have a stack of their own (phase 34):
[`stacks/python/`](https://github.com/Sarverott/P-jol-roll/tree/master/stacks/python),
a uv project reading the law through the same MCP tools (`Law`) and asking
the mastermind through `/api/ask` (`Mastermind`). `task python:check`,
`task python:law -- nearest "obowiązek szkolny"`.

## The executive agent

Not a chat but a task (phase 33): a small qwen does what a person gives it,
reading the law through the MCP tools, and writes what it is asked for into
`resources/agent/` - the only place it can write; it runs no command and
fetches no page.

```bash
task agent -- "Przeczytaj dekret DU/1919/147 i zapisz w pliku obowiazek-szkolny-1919.md streszczenie"
task agent:container -- "..."     # the same in the agents' shell, with Ollama of the profile llms
```

Its first real task, on this machine: it read the school decree of 1919 and
wrote `resources/agent/obowiazek-szkolny-1919.md` - school age from 7, seven
years of school, to 14 - citing the articles, the act marked read. Every
run is kept as a conversation (`resources/conversations/qwen/...`).

Two engines (`AGENT_ENGINE`):

- **own** (the default): the mastermind's rounds with the MCP tools given
  directly, and one tool of its own, `write_note` (a bare file name, markdown,
  never outside `resources/agent/`); its instructions are
  `resources/configs/mastermind/executive.md`.
- **opencode**: opencode 2 as its host, as planned, from
  `resources/configs/agentic-shell/opencode/` - its own config and data
  directories (`resources/.containerdatavol/agent/`), so neither the
  person's opencode settings nor sessions are touched, `--standalone`, a
  model of its own with a 24k context. Not yet reliable: opencode 2 hands an
  MCP server's tools over through Code Mode, and in some runs it does not
  find the server's namespace (*Unknown tool 'p-jol-roll.act_text'*).

| Variable | Default | What it is |
| --- | --- | --- |
| `AGENT_MODEL` | `qwen3:8b` | the model |
| `AGENT_OLLAMA_URL` | `http://127.0.0.1:11434/v1` | its Ollama (`http://llms-ollama:11434/v1` in the shell) |
| `AGENT_ENGINE` | `own` | `own` or `opencode` |
| `AGENT_ROUNDS`, `AGENT_CONTEXT` | 8, 24576 | rounds of tools (own); context of its model (opencode) |

## Ollama on its own drive

The models are large and many, so the Ollama of this machine keeps them on
a drive of their own: `OLLAMA_MODELS` in `.env` (the variable Ollama
itself reads) names the directory.

```bash
task ollama:where        # where they are read from, and how many are there
task ollama:serve        # the first start copies ~/.ollama/models there, then serves from there
task ollama:copy         # the copy again: only what is missing, then checked
```

The old directory is never deleted by them. Stop the Ollama that runs
first (`ss -ltnp | grep 11434` shows it). A drive whose root belongs to
root needs its directory made once: `task ollama:serve` says the `sudo`
line.

## The conversations kept

Every question is kept with everything said, so models and families can be
compared:

```text
resources/conversations/<family>/<instance>/<UNIXUSAT>-<the question's first words>.json
resources/conversations/deepseek/deepseek-r1-8b/1795498362594-czym-byla-rada-stanu-w-1918-roku.json
```

The family comes from `resources/configs/mastermind/families.yaml` (the
models of one family act as one team: `gemma4`, `translategemma`,
`embeddinggemma`, `shieldgemma`... are all `gemma`); the instance is the
model with its size. A file holds the question, the answer, the reasoning,
the acts cited, the tools called, how long it took and the whole exchange -
the texts given and what the tools answered. The directory is the local side
of their own dataset,
[Apokryf/Consiliariis-Polonicum-Lex](https://huggingface.co/datasets/Apokryf/Consiliariis-Polonicum-Lex)
(`conversations` of `resources/.map.json`): `task resources:push --
conversations` sends what is new, a person's move; git keeps only its card.
`MASTERMIND_KEEP=0` keeps nothing. In compose it is
the one directory the mastermind writes.

## Families as teams

`resources/configs/mastermind/families.yaml` names the families and their
teams: one model answers, one calls the tools in the rounds, one turns an
answer given in another language into the question's, one guards (its
verdict kept, nothing held back). A model is given thinking and tools only
when Ollama says it can take them.

```bash
MASTERMIND_TEAM=gemma task mastermind:ask -- "..."   # gemma4 answers, functiongemma calls tools,
                                                     # translategemma translates, shieldgemma guards
task mastermind:compare                              # every team, the questions of questions.yaml
task mastermind:compare -- bielik qwen               # only these
task resources:push -- conversations                 # what they said, to their dataset
```

The first comparison (phase 31, 30 answers):

| Team | Models | A question | Acts cited (read) | What its answers were like |
| --- | --- | --- | --- | --- |
| gemma | gemma4:12b, functiongemma:270m, translategemma:4b, shieldgemma:2b | 65-150 s | 8 (6) | the closest to the text: the twelve virilists of DU/1918/2 named one by one; once "the acts do not answer" in English (the check of Polish then missed it - fixed); the slowest, four models taking turns on 12 GB; functiongemma called no tool in any round |
| deepseek | deepseek-r1:8b | 31-69 s | 10 (9) | broken Polish, words of no language |
| mistral | ministral-3:8b | 14-44 s | 11 (10) | fast, clear Polish with headings, citing what it read |
| qwen | qwen3:8b | 20-52 s | 13 (12) | fluent, cites articles (`art. 12`) |
| llama | llama3.1:8b | 8-46 s | 2 (2) | the fastest; three answers of five cite nothing |
| bielik | Bielik 11B v3.0 Q4_K_M | 16-57 s | 8 (6) | the most natural Polish; adds what it knows beyond the acts read (the Council dissolved on 7 October 1918 - true, but not from them) |

## Settings

| Variable | Default | What it is |
| --- | --- | --- |
| `MASTERMIND_URL` | `OLLAMA_URL` | the model's api: an Ollama, or an OpenAI-like one ending in `/v1` (LiteLLM of the profile `llms`); set on an api, it makes `/api/ask` answer |
| `MASTERMIND_TEAM` | | a team of `families.yaml` (`gemma`, `bielik`, ...) |
| `MASTERMIND_MODEL` | the team's answer, else `deepseek-r1:8b` | the model that answers |
| `MASTERMIND_KEY` | | a key for an OpenAI-like api |
| `MASTERMIND_ROUNDS` | 6 | rounds of tools at most |
| `MASTERMIND_CONTEXT` | 16384 | the context of an Ollama model, in tokens |
| `MASTERMIND_WORDS` | 4096 | tokens it may write, thinking too |
| `MASTERMIND_READ` | 6000 | characters of one tool's answer kept |
| `MASTERMIND_FIRST` | 3 | texts of the nearest acts read before it speaks |
| `MASTERMIND_PORT`, `OLLAMA_PORT` | 8081, 11434 | the ports of compose |

## On the demo space: the visitor's own Hugging Face

The tab **ask the law** of the viewer (`#ask`) is the same mastermind as a
chat: every cited act a link to its page, the acts it named without reading
them marked with `?`, its reasoning folded.

On the demo space (phase 32) it runs on the visitor's own account, as the
owner's other space does: the space's card asks for `hf_oauth` with the
scope `inference-api`, the visitor signs in with Hugging Face (`/login`),
and the token stays in the server's memory behind an HttpOnly cookie - it
never reaches the browser, a file or a log. Then:

- the model through Inference Providers (`https://router.huggingface.co/v1`),
  `google/gemma-4-26B-A4B-it` by default (`DEMO_MODEL`; `DEMO_URL` for
  another api), paid from the visitor's credits;
- the question a vector by `BAAI/bge-m3` on Hugging Face, the same model as
  the vectors of the dataset, which the space takes on its first question
  (about 760 MB);
- one question at a time per visitor, four at once in all; a visitor's
  conversation is not kept.

A visitor without credits left gets Hugging Face's own answer: *"Purchase
pre-paid credits to continue using Inference Providers"*. The space signs
in nobody without `hf_oauth` in its card, and `/api/ask` then says so.

| Variable | Default | What it is |
| --- | --- | --- |
| `DEMO_MODEL` | `google/gemma-4-26B-A4B-it` | the model on the space |
| `DEMO_URL` | `https://router.huggingface.co/v1` | its OpenAI-like api |
| `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OPENID_PROVIDER_URL`, `SPACE_HOST` | set by Hugging Face | signing in |

## What to expect

`deepseek-r1:8b` on an RTX 3060 answers in 30 seconds to a few minutes,
most of it thinking. It is the smallest voice of the plan: it now and then
answers in English, slips a word of another script into Polish, or cites an
act it did not open - which the check marks. The larger deepseek of phase
34 (the advanced strategy above) is for the hard questions.
