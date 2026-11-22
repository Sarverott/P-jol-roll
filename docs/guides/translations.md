# Translations

The owner's idea (Q15, changelog phase 12): pages are not rewritten with
names of texts and loaders. Their text nodes are found, hooked by a SHA-256
of what they say, and their content is replaced from a language pack.
Phase 16 checked it first, in `src/i18n/` with `tests/i18n.test.ts`. This
page says what came out.

## How it works

```text
"115 acts"  -> normalized, numbers as holes -> "{0} acts" -> SHA-256 -> 6f1c...e2
pack PL-PL: "6f1c...e2": { "one": "{0} akt", "few": "{0} akty", "many": "{0} aktów" }
            -> "115 aktów"
```

- `src/i18n/sha256.ts`: SHA-256, synchronous, the same in a browser, in
  node and in a terminal (checked against node's own).
- `src/i18n/hooks.ts`: `hookOf(text)`, `translate(pack, text)`, and
  `t(pack, text)` for a terminal: the pack's text, or the English when the
  pack has none. A number in a text is a hole, so "3 acts" and "115 acts"
  are one entry; an entry can hold the plural forms of its language
  (`Intl.PluralRules`), chosen by the first number.
- `src/i18n/dom.ts`: `collect(root)` gives every hook of a page with its
  English template (that is how the default pack is made), `apply(root,
  pack)` lays a pack over the page, and `apply(root, undefined)` gives the
  English back, which is remembered per node. `follow(root, pack)` keeps the
  pack over what a framework renders later.

## What works

| Checked | How |
| --- | --- |
| text nodes and the attributes people read (`placeholder`, `title`, `aria-label`, `alt`) | a page in linkedom |
| numbers and plural forms (1 akt, 3 akty, 115 aktów) | `t()` and the page |
| data is never translated: titles and texts of acts sit under `translate="no"`, the attribute HTML has for it; `code` and `pre` are skipped too | the page |
| back to English, or to another language, without reloading | the page |
| what Vue renders later: a text node written again holds English, the observer translates it again; the English it remembered is dropped | jsdom, as a browser |
| one pack for every interface: the same hook in a page, the launcher and the CLI | `t()` takes plain strings |

Vue patches a text node by writing its `nodeValue` only when its own
virtual text changes, and it never reads the DOM back. A translated node
therefore stays translated until Vue writes it again, and then the observer
translates it again. The page and the framework do not fight.

## What does not, and what is done about it

- **A sentence cut by markup** ("the <a>PDF at the source</a> is the
  text") gives fragments, each hooked alone. Word order differs between
  languages, so fragments translate badly. Such sentences get their own
  short wording, or an element marked as one unit later on.
- **The same English, two meanings** ("status" as a column and as a state)
  is one hook. When it matters, the element gets `data-i18n-context`, which
  salts the hook (not needed yet).
- **Changing the English orphans its translation**, because the hook
  changes. The pack keeps the English of every entry, so the script that
  makes packs finds orphans and translates the new English again; old
  entries are dropped.
- **Search engines do not see a translation made in the browser.** The
  introduction and the documentation are therefore translated when the
  website is built, by the same `apply()` over the built HTML, into
  `/<language>/` copies. The viewer is translated in the browser.
- **The English flashes** before a pack arrives. The pack is loaded before
  the viewer mounts.

So the idea holds, with no texts named in code: the pages stay as written,
data is marked once with a standard attribute, and one small library
serves the browser and the terminal.

## Language packs

`resources/locales/` holds a JSON file per language, listed in
`resources/locales/.index.json` with EN-US the default:

| Pack | Made by |
| --- | --- |
| `EN-US.json` | `task i18n:collect`: the built introduction and viewer opened in a headless browser, their own runtime collects every text with its hook |
| `PL-PL.json`, `UK-UA.json`, `DE-DE.json` | `task i18n:translate`: argostranslate (the engine of LibreTranslate), models downloaded once |

```sh
task web:build && npm run --prefix webpage build    # both pages built
task i18n:collect                                   # their English -> EN-US.json
task i18n:translate                                 # what the other packs miss
task i18n:translate -- PL-PL --again                # one pack anew (not its reviewed entries)
```

- A text with a number is translated once per plural form of the language,
  with the number that form takes (`plural` in the index: Polish one 1,
  few 3, many 5), and the number becomes the hole again.
- Names in `keep` of the index (Dziennik Ustaw, Sejm, SAOS, P_JOL_ROLL...)
  are never translated: they stand in as numbers while the model works,
  because letters get transliterated by some models and numbers never do.
- Machine translation makes mistakes ("Bucket" became "Bukiet"). A person
  fixes an entry in the pack and lists its hook in `reviewed`. The script
  never overwrites a reviewed entry and never drops it.
- A language is added by a line in the index (with its `argos` pair) and
  `task i18n:translate`.

The viewer and the introduction take the pack of `?lang=PL-PL`, else the
last choice, else the browser's languages, else English. They load only
that pack and lay it over the page before it shows, and a switch in the
header changes it without a reload.

The documentation is translated when the website is built
(`scripts/devops/pages/build.sh` runs `src/devtools/docs-i18n.ts`): the
built MkDocs site is copied into `site/docs/pl-pl/`, `uk-ua/` and `de-de/`,
and each pack is laid over the guides, the glossary and the home page by
the same `apply()` the browser uses. The changelog and the devlog stay in
English in every copy, because they keep the owner's words word for word.
Every page gets a list of languages in its header, pointing at the same
page in each copy. Read the Docs builds only the English.

Identifiers are never translated: a text that is one path or name
(`datasets/Sarverott/polish_national_law_docs`) gets no hook, and one inside
a sentence (`resources/.map.json`, `SHA-256`, `v0.11.0`) stands in as a
number while the model works, like the names of `keep`.
