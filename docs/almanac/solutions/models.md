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

- **A model of Ollama without thinking or tools is refused them**:
  `/api/show` says its capabilities, asked once per model (translategemma,
  shieldgemma and Bielik take no thinking; the last two no tools in some
  builds).
- **functiongemma (270M) calls no tool unaided** in the rounds of the
  mastermind: it is made to be tuned for its functions first.
- **A team of four models on one card of 12 GB is swapped in and out**:
  an answer of gemma's team takes twice as long as one model.
- **A check of language by common words must leave out the words two
  languages share** ("do", "to", "i"): "The acts you read do not answer the
  question" passed for Polish (phase 31).
- **Inference Providers are paid from the account whose token asks**
  (402 *Purchase pre-paid credits* when they are spent), the embedder of
  `hf-inference` too: the demo space asks on the visitor's token, never on
  the owner's (phase 32).
- **Signing in with Hugging Face goes to huggingface.co, which is not shown
  in a frame**: the space's links to `/login` open at the top, and the
  cookie is `SameSite=None; Secure` for the space shown inside
  huggingface.co.
- **Models write markdown** (`**`, `###`, links around an ELI): the chat reads it as
  pieces of text, never as HTML, so an answer cannot put anything on the
  page.
- **The text of an act is the act as published** (phase 36): the law in
  force is its newest consolidated text, an announcement of its own (*Inf.
  o tekście jednolitym* in its ties); a model given the 1997 text of the
  Banking Law reasoned about state banks. Read the consolidated one.
- **A small model asked for proposals writes an explainer** unless the
  task is said again at the end of the prompt, numbered; and it invents a
  "basis" (a journal and a position) unless told to name only what it was
  given (phase 36).
- **MCP's Python SDK 2 is not the 1.x of the examples**: the http client
  is `streamable_http_client(url, http_client=httpx2.AsyncClient(...))`
  (headers on the client), a result says `is_error`, and an error raised
  inside a session comes out wrapped in an `ExceptionGroup` by its tasks -
  `Law.open()` gives a single one as it is (phase 34).
- **Ollama's OpenAI-like api gives a model the context it was made
  with**: opencode's prompt and tools were cut and the model never saw its
  tools; a model of its own with `num_ctx` (`/api/create`, only a manifest)
  is the agent's (phase 33).
- **opencode 2 hands MCP tools over through Code Mode** - code for
  `execute` calling `tools["server"].tool({...})`, a function body, never an
  unrun arrow function; `codemode: false` (in its own `mcp.servers` form)
  offered no tools at all, and in some runs the server's namespace was not
  found. The agent's own rounds are the default.
- **opencode 2 runs a background service**: `opencode run --standalone`
  keeps the agent off the person's; `opencode debug ...` without it starts
  one, which lingers with its MCP server - stopped by pid.
- **Ollama's models live where `OLLAMA_MODELS` says** - the variable is
  read by `ollama serve` itself, not by the client; a server started
  without it reads `~/.ollama/models`. Blobs never change once written, so
  they are copied while it runs, and the manifests last (phase 31).
- **A drive mounted by the desktop may have a root that belongs to
  root**: its directory is made once by its owner with `sudo`; the script
  says the line instead of failing on it.

## Cases

None yet with a page of their own: the lines above are from phase 30.
