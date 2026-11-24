# Language models

The law mastermind (phase 30, `src/mastermind/`) asks a model of Ollama -
the host's on this machine, the service `llms-ollama` elsewhere - through
the MCP tools of `src/mcp`.

- **A small distilled model seldom calls a tool.** What it must read is
  found and read first, through the same tools, and given with the
  question; the tools stay offered for more.
- **Pieces of a conversation with tools confuse deepseek-R1's template.**
  Texts given as answers of tools it never called made it imitate the
  markers of tool output and loop on one word; given inside the question,
  they are read.
- **deepseek-R1 distilled writes its calls as its own tokens**
  (`<｜tool▁call▁begin｜>function<｜tool▁sep｜>name` and JSON), which Ollama
  leaves in the text: they are parsed there, and their arguments fitted to
  the tool's schema (a number written as words, names it does not take).
- **A thinking model may think longer than fetch waits for the first
  byte** (five minutes in undici): the answer is streamed.
- **Without limits a small model repeats one word to the end of its
  context**: `num_predict`, `repeat_penalty` 1.1, temperature 0.6.
- **A model names acts from memory.** Every cited ELI is checked against
  the acts it opened; the others are marked not read, never hidden.
- **Vectors of every year do not fit the heap as numbers of JavaScript**
  (761 MB of parquet, the api ran out of memory on its first question):
  they are kept as int8 per year, enough to rank normalized vectors.

- **Ollama's models live where `OLLAMA_MODELS` says** - the variable is
  read by `ollama serve` itself, not by the client; a server started
  without it reads `~/.ollama/models`. Blobs never change once written, so
  they are copied while it runs, and the manifests last (phase 31).
- **A drive mounted by the desktop may have a root that belongs to
  root**: its directory is made once by its owner with `sudo`; the script
  says the line instead of failing on it.

## Cases

None yet with a page of their own: the lines above are from phase 30.
