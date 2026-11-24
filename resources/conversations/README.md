---
license: cc-by-sa-4.0
language:
  - pl
  - en
pretty_name: Consiliariis Polonicum Lex
tags:
  - law
  - poland
  - legal
  - llm
  - conversations
  - tool-use
  - mcp
size_categories:
  - n<1K
---

# Consiliariis Polonicum Lex

The conversations of the law mastermind of
[P_JOL_ROLL](https://github.com/Sarverott/P-jol-roll): questions about the
law of Poland answered by language models that read the acts of Dziennik
Ustaw and Monitor Polski through the project's MCP tools and cite each act
by its ELI. Every conversation is kept, so that models and their families
can be compared on the same questions. **Not (formally) legal advices** - answers of
small local models, kept as they were given, mistakes included.

## Layout

```text
<family>/<instance>/<UNIXUSAT>-<the question's first words>.json
deepseek/deepseek-r1-8b/1795498362594-czym-byla-rada-stanu-w-1918-roku.json
```

- **family** - the models that act as one team
  ([families.yaml](https://github.com/Sarverott/P-jol-roll/blob/development/resources/configs/mastermind/families.yaml)):
  `gemma`, `deepseek`, `qwen`, `llama`, `mistral`, `bielik`, ...
- **instance** - the model with its size or tag (`gemma4-12b`).
- **a file per session**, in the order they came (`UNIXUSAT`: milliseconds
  since 1970).

## A session

| Field | What it is |
| --- | --- |
| `UNIXUSAT`, `date`, `seconds` | when it was asked and how long the answer took |
| `family`, `instance`, `model`, `url`, `settings` | who answered and how it was set (rounds, context, characters read) |
| `question`, `answer`, `thinking` | the question, the answer, the model's reasoning when it gives one |
| `cited` | every ELI of the answer; `read: true` when the model opened that act through a tool, `false` when it named it from memory |
| `steps` | the tools called, with their arguments, in order |
| `rounds` | rounds of the conversation with the model |
| `exchange` | the whole conversation: what the model was given (the acts found by meaning, their texts), what it said, what the tools answered |

## Where it comes from

Made by `src/mastermind/` of P_JOL_ROLL (`task mastermind:ask`, `/api/ask`)
into `resources/conversations/`, and sent here by
`task resources:push -- conversations`. The acts themselves are in
[polish_national_law_docs](https://huggingface.co/datasets/Sarverott/polish_national_law_docs).
