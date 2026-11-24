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

## Settings

| Variable | Default | What it is |
| --- | --- | --- |
| `MASTERMIND_URL` | `OLLAMA_URL` | the model's api: an Ollama, or an OpenAI-like one ending in `/v1` (LiteLLM of the profile `llms`); set on an api, it makes `/api/ask` answer |
| `MASTERMIND_MODEL` | `deepseek-r1:8b` | the model |
| `MASTERMIND_KEY` | | a key for an OpenAI-like api |
| `MASTERMIND_ROUNDS` | 6 | rounds of tools at most |
| `MASTERMIND_CONTEXT` | 16384 | the context of an Ollama model, in tokens |
| `MASTERMIND_WORDS` | 4096 | tokens it may write, thinking too |
| `MASTERMIND_READ` | 6000 | characters of one tool's answer kept |
| `MASTERMIND_FIRST` | 3 | texts of the nearest acts read before it speaks |
| `MASTERMIND_PORT`, `OLLAMA_PORT` | 8081, 11434 | the ports of compose |

A public host - the demo space - never asks a model, even with
`MASTERMIND_URL` set.

## What to expect

`deepseek-r1:8b` on an RTX 3060 answers in 30 seconds to a few minutes,
most of it thinking. It is the smallest voice of the plan: it now and then
answers in English, slips a word of another script into Polish, or cites an
act it did not open - which the check marks. The larger deepseek of phase
32 is for the hard questions.
