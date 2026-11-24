# The code of law analysed, simulated, improved

Phase 36 (the owner's plan in
[Q18](https://github.com/Sarverott/P-jol-roll/wiki/Devlog-VISION)): the
code of law analysed deeply, how a change of law meets people simulated
offline, and improvements proposed. **Not legal advice**: what the data
says, and what models make of it.

## The analysis: every act in force against its ties

No model where the data says it exactly. `task analyse` reads the listings
(`dataset/acts`) and the ties (`dataset/references`, `task compile`) of
every year here and checks every act in force (statuses *obowiązujący* and
*akt posiada tekst jednolity*):

| Kind | Found when | It suggests |
| --- | --- | --- |
| `basis-repealed` | its legal basis (*Podstawa prawna*) is repealed or expired | check whether transitional provisions keep it in force; else repeal it or issue it again on a basis in force |
| `reference-repealed` | it refers (*Odesłania*) to a repealed act | refer to the act that repealed it (named where the ties say so), or to what took its place |
| `consolidation-due` | a statute, regulation, decree or code amended 5 times or more (`ANALYSE_CONSOLIDATE`) since its last consolidated text, or ever without one | a new consolidated text |
| `tribunal` | judged by the Constitutional Tribunal (*Orzeczenie TK*) and not amended since the judgment was published | check whether the judgment waits for the legislator |

An act that only amends others (*o zmianie*, *zmieniające*) is left out:
its references are spent, and its changes live in the act it amended.

```bash
task analyse                                  # into dataset/analysis/ (findings.jsonl, summary.json), 2 s
task do -- analysis eli=DU/1997/939           # one act's findings
curl "http://127.0.0.1:8080/api/analysis?kind=tribunal&limit=5"
```

On this machine (2026-11-24): 165,006 acts read, 23,238 in force, 3,937
findings - 1,064 legal bases repealed, 2,678 references to repealed acts,
153 consolidated texts due, 42 Tribunal judgments not followed. The act's
page shows them (*the analysis found ...*), every act named a link; MCP
gives them as the tool `analysis`.

## The simulation bubble

People of different lives (`resources/configs/simulations/personas.yaml`:
a pensioner, a student, a garage owner, a nurse, a farmer, a newcomer from
Ukraine, a lawyer, a teacher, a mayor of a rural commune, a programmer with
a disability - invented, no one real) read an act and talk about it. Each
is a model of the host's Ollama. They read what MCP gives of it: its newest
consolidated text (or the act as published), what the analysis found, what
was said of it in Sejm (phase 35). In the first round each says where they
stand and why; in the next ones each reads the others and answers, or
changes their mind.

```bash
task python:simulate -- DU/1997/939 --rounds 3 --personas 6
```

Every run is kept in
`resources/simulations/<journal>/<year>/<position>/<UNIXUSAT>.json`: the
act as they read it, every post, where each ended, who changed their mind.
Three people, two rounds of the Banking Law took 48 s with
`ministral-3:8b` on the RTX 3060.

The bubble is the project's own rather than OASIS or MiroFish: those bring
torch, sentence-transformers and neo4j and simulate a social network; this
one is small and keeps every word. It is a way to see an act from where it
lands - a model's words in invented mouths, not a survey.

## Improvements proposed

```bash
task python:propose -- DU/1997/939
```

A model (`PROPOSE_MODEL`, `qwen3:8b`) gets the act's newest consolidated
text, its findings, its debates and the last simulation, and writes one
proposal per finding - the provision, the problem, the change, what it
rests on - then what the text and the people's voices suggest. Kept in
`resources/proposals/<journal>/<year>/<position>/<UNIXUSAT>.md`, with what
it was given. `ministral-3:8b` wrote an explainer for citizens instead of
proposals; `qwen3:8b` followed the findings one by one.

| Variable | Default | What it is |
| --- | --- | --- |
| `SIMULATION_URL` | `http://127.0.0.1:11434/v1` | the models' OpenAI-like api |
| `SIMULATION_MODEL` | `ministral-3:8b` | the people of the bubble |
| `PROPOSE_MODEL` | `qwen3:8b` | the one who proposes |
| `SIMULATION_KEY` | | a key, when the api wants one |
| `ANALYSE_CONSOLIDATE` | 5 | amendments since the consolidated text that make one due |
