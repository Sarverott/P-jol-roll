# ORDERS: the owner's decisions

The owner's answers to `Q<n>` of [BRAINSTORM.md](BRAINSTORM.md) and decisions
on `PP<n>` of [PROPOSALS.md](PROPOSALS.md), each under `### Q<n>` or
`### PP<n>`, written below the line. Agents move them word for word into the
changelog and leave this file with its header only.

---

### Q15

after phase 12, a small local multilingual model. massive translations can be made with LibreTranslate engine - argostranslate. 

this will require codes in python so we can make them part of scripts that will produce us autotranslations linguistic packs, that will be used with i18n integrations for ducumentation, webpage of project, GUI, TUI and CLI manuals.

don't write all over again, instead of that and replacing texts with text loaders search text nodes and replace their content based on mapped SHA265 mapped listing of DOM hooks of elements - this is bare conceptual idea that i just came up with, so we have to check if my theoretical way is achievable with no mess in code.

all translations should be placed in `resources/locales/` dir as json files like `EN-US.json`. organization of language packs i left to you but all of them should be present listed in `resources/locales/.index.json` with defining default as "EN-US".



### Q16

i tried to parse these pdfs and push that, but unfortunately failed and throws error. also space is requiring updates that does not presented while i try to restart demo. 

we need all law files be markdowned and placed in dataset. idea with per-act markdown files sounds... actually good. this gives us possibility to deconstruct long docs and exclude duplicates of entries this way. if the limit is reduced count of how many commits we can push we can just push 128 pushes with 1000 files every hour, that is acceptable way. we can at least try.