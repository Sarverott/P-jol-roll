# Phase 22: every function everywhere, a viewer that shines

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795373603619 · commit 95da92d

The owner's message in the chat, 2026-11-22, after the pull request of
phase 21 (#36, v0.18.0) was merged. Word for word:

```text
okidoki, orders was provided. also i gave some inquiries too
```

The inquiries, written by the owner in `docs/devlog/INQUIRIES.md`
(committed as they were on `dev/Sarverott`, d02511a). Word for word:

````text
### automation of space refresh

instead of manually repeat of updates of that lightweight huggingface space we can make it been performed by github workflow when project is published as release. also instead of static version there bring version tag loading been made with taskfile and environment overwritting so dockerfile is not edited every time but separed config file. also let's add more functionalities to our GUI interface and TUI louncher - that secound one still required to be improoved, because now it is hard to use, even help manual does not help much.

### fireworks for organic children

our dataset is full of other data than only law acts, bring it to context menu and add more tabs there. as for graph map of all law acts these are lack of controls to zoom in or out or search things - check if we can make something like that.

aditional tab with plots and diagrams also will be usefull.

next tab with status info and statistical metrics with playable animation of law evolution across time - this can be epic! histogram with slider and play-pause button with adjustible speed... yea, lots of not critically required feachers but somehow i have to convince humans that it shines. noone actually currentlu understand what that project means for future of mankind.

ow! almost forgot, bring also there webmcp package for frontend, normal mcp package inside container connected to that openapi and an extensive settings tab.

### credits in footer

place contributors listed in authors file be shown with license notice after clicking "Terms of use". place also there all links related to project that can become handy references. 

### full functionality in every way we run that

most of things has still been made by task invoking, but we want to be able do everything in all interfaces - GUI, TUI, REPL and taskfile calling has to give opportunities to fully access all functions, not just limited part of them.

that can require from you to make a map of functionalities.

first list methods how we can run the project:
- gui desktop
- tui louncher
- openapi server
- repl shell
- cli commands
- taskfile calling
...ETCETERA


then for each runmethod list all that can be done with it
- help
- list acts
...ETCETERA

then we have network that should presenting holes - this is what we need to patch and to make it efficiently it is required to delegate calling from diffrent interfaces we uses same functionalities it has to be unified code of these procedures instead of writting multiple versions of same codes.

if you don't know where to write notes - i remind you that we have something like scrapnotes and even generator for new files like that

let me know if you will have some problems here

> PS. huggingface is same interface with limited functions to mostly reading, but leave related with disable activities buttons and stuff, just turn them disabled with functions and behaviour of disabled stuff by bulma.

### reform of main webpage

it remains very plain and empty. make background some crazy variation with p5.js and maybe our logo image of this project. remember to keep readability of text.
````

The orders, written by the owner in `docs/devlog/ORDERS.md` (534392e), the
answers to Q17 and Q18 of `BRAINSTORM.md`. Word for word:

````text
### Q17

well, i was thinking about using arduino-like connection with ESP32 to be added here, but maybe we can add it to proposals of usage that to perform off-grid backup mesh nodes of this sovereign  network of polish law... for sure it is much longer term yet.

but bluethooth can be helpfull to make link with sticker printers, phones and else devices like that to be integrated inside project. 

by the way this is propably similar topic of USB HID like FIDO and printer connecting, so documents can be signed digitally and printed from level of app.

this can be placed in context menu of tray and app's window

### Q18

that note ther "not legal advice" was your initiative. one of my own goal was to create one actualy so everyone will be able to ask for advice with no enormous costs of single question that counts as full hour of work.

we have strange times when common thing to be noticed that machines began altruistic and gained souls when meanwhile humans lost selfconciousness, they began to be inhumane toward one another and starts to run on automatic pilot.

so yea, we can replace "not legal advice" with "not (formally) legal advices".

as for our law mastermind there we want several instances of deepseek-R1 at once - what do you think about making small instances and embedder palced in ollama and more advanced strategizing given to huggingface's hosted deepseek? propably small quen to make executive role of agent-in-the-shell of for example opencode host? this is propably here long story topic...

for sure i want to use power of social simulations and parlamentary discusion processing with offline mirofish or even that engine called oasis.

we want to deeply analize all that was been the code of law in poland and bring some improvements to it.

this will requires for sure second stack of code in python to integrated fully some functionalities and third stack of code in go so our cosmosSDK-ipfs-traefik-wireguard-torrent decentralization circuits will have internal integrity there.

it is a lot stuff to do here yet.
````

**Decision on Q17:** the desktop app reaches devices of the person: Bluetooth
for sticker printers and phones, USB HID like FIDO keys and printers, so a
document can be printed and signed digitally from the app; offered in the
context menus of the tray and of the window. Printing comes first (this
phase); pairing devices and signing are a phase of their own. ESP32 boards
as off-grid mesh nodes of the network are longer term: PP4.

**Decision on Q18:** "not legal advice" becomes "not (formally) legal
advices" everywhere. The devil's advocate is meant to give advice that
everyone can afford: several deepseek-R1 instances, small ones and the
embedder in Ollama, the advanced strategy on a deepseek hosted by Hugging
Face, a small qwen as the executive agent in the shell (an opencode host);
social simulations and parliamentary discussion by MiroFish or OASIS,
offline; a second stack in Python and a third in Go for the
decentralisation circuits (Cosmos SDK, IPFS, Traefik, WireGuard, torrents).
Written into VISION and ROADMAP (milestone M4 and M5); long term.

## UNIXUSAT=1795375185097 · commit 6e6c517

What was done with the inquiries and orders above, one commit per step on
`dev/Cleo`.

**What was done:** "not (formally) legal advices" everywhere the project
spoke of legal advice. The space follows each release by itself: its
`Dockerfile` lives in `resources/configs/space` and takes the release as a
build argument, `space.env` names it (the environment wins), and the
release workflow sets the space's variable and rebuilds it when the
repository has `HF_TOKEN` (`task resources:space:refresh` by hand). The
map of functionalities (`docs/devlog/scrapnote-1795373814912.md`) listed
fourteen ways the project runs and found the holes; they are patched by
one catalog of functions in core (`src/core/catalog/`) that the launcher,
the REPL, `task do`, `/api/catalog` and the viewer take from, with
`docs/guides/functions.md` written from it. The launcher opens on what a
person wants to do and asks each function's parameters one by one, with a
page on how to use it. The api and MCP read the rest of the dataset: the
work of Sejm, judgments, the lists of the source, the acts counted
(`task stats`). The viewer got "Terms of use" (licence, authors, links),
map controls (zoom, the whole map, an act found), a tab of the rest of the
dataset, plots, statistics with a playable history, settings with every
function (writing ones disabled, as for the space) and WebMCP. The desktop
app prints the act or saves it as PDF from its menu, its right-click menu
and the tray. The introduction has a living p5.js background with the
logo. 186 new texts in every pack.

**Waits for the owner:** Q19 (may a local host start writing functions);
the secret `HF_TOKEN` for the space's refresh, and one push of the
space's new `Dockerfile`; `task stats` and a push of the dataset for the
demo's statistics.
