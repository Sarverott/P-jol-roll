# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["argostranslate==1.11.0", "torch"]
#
# [tool.uv.sources]
# torch = { index = "pytorch-cpu" }
#
# [[tool.uv.index]]
# name = "pytorch-cpu"
# url = "https://download.pytorch.org/whl/cpu"
# explicit = true
# ///
"""Language packs of resources/locales/ made from EN-US.json by argostranslate (phase 16, Q15).

Every pack of .index.json with an "engine" gets what EN-US.json has and it does not: a text
with a number is translated once per plural form, with the number that form takes (the
"plural" of the pack: pl one=1 few=3 many=5), and the number becomes the hole again. Hooks
that EN-US.json no longer has are dropped, unless listed in the pack's "reviewed" (a person
wrote them; they are never overwritten either). Models are downloaded once into argos's own
folder. Names listed in "keep" of .index.json (Dziennik Ustaw, Sejm, SAOS...) are never translated.
Run: task i18n:translate [-- PL-PL ...] [--again]   (uv run --script scripts/i18n/translate.py)
"""

import json
import re
import sys
from pathlib import Path

import argostranslate.package
import argostranslate.translate

ROOT = Path(__file__).resolve().parents[2]
LOCALES = ROOT / "resources" / "locales"
HOLE = re.compile(r"\{(\d+)\}")
# numbers that stand in for holes past the first: unlikely to be touched by a translation
STAND_INS = [7, 8, 9, 6, 4]
# names stand in as numbers too (letters are transliterated by some models, numbers never)
NAMES_FROM = 701


def model(source: str, target: str):
    installed = {(p.from_code, p.to_code) for p in argostranslate.package.get_installed_packages()}
    if (source, target) not in installed:
        argostranslate.package.update_package_index()
        found = next(
            p for p in argostranslate.package.get_available_packages()
            if p.from_code == source and p.to_code == target
        )
        print(f"downloading the model {source} -> {target}", flush=True)
        argostranslate.package.install_from_path(found.download())
    return argostranslate.translate.get_translation_from_codes(source, target)


def filled(template: str, first: int) -> tuple[str, list[str]]:
    """The template with numbers in its holes, and those numbers in order."""
    numbers: list[str] = []

    def put(match: re.Match) -> str:
        at = int(match.group(1))
        number = str(first if at == 0 else STAND_INS[(at - 1) % len(STAND_INS)])
        numbers.append(number)
        return number

    return HOLE.sub(put, template), numbers


def holed(text: str, numbers: list[str]) -> str:
    """The numbers of a translation turned back into holes, in the order they were put."""
    for at, number in enumerate(numbers):
        text = re.sub(rf"(?<!\d){re.escape(number)}(?!\d)", f"{{{at}}}", text, count=1)
    return text


def kept(translate, keep: list[str]):
    """A translation where the names of keep stay as they are written."""
    names = sorted(keep, key=len, reverse=True)

    def run(text: str) -> str:
        used: list[tuple[str, str]] = []
        # identifiers in a sentence too: paths, addresses, names_with_underscores, SHA-256
        found = re.findall(r"(?<!\S)[\w./:@-]*(?:[/_.:@]\w|\w-\d)[\w./:@-]*", text)
        for name in [*names, *sorted(set(found), key=len, reverse=True)]:
            pattern = rf"(?<![\w-]){re.escape(name)}(?![\w-])"
            if re.search(pattern, text):
                stand_in = str(NAMES_FROM + len(used))
                used.append((stand_in, name))
                text = re.sub(pattern, stand_in, text)
        text = translate(text)
        for stand_in, name in used:
            text = re.sub(rf"(?<!\d){stand_in}(?!\d)", name, text)
        return text

    return run


def translated(translate, template: str, plural: dict[str, int]):
    if not HOLE.search(template):
        return translate(template)
    forms = {}
    for form, number in plural.items():
        text, numbers = filled(template, number)
        forms[form] = holed(translate(text), numbers)
    # one form for every number when the language does not change the words
    return next(iter(forms.values())) if len(set(forms.values())) == 1 else forms


def main(asked: list[str], again: bool) -> None:
    index = json.loads((LOCALES / ".index.json").read_text())
    english = json.loads((LOCALES / f"{index['default']}.json").read_text())["texts"]
    for listed in index["packs"]:
        engine = listed.get("engine", {}).get("argos")
        if not engine or (asked and listed["code"] not in asked):
            continue
        path = LOCALES / listed["file"]
        pack = json.loads(path.read_text()) if path.exists() else {}
        texts = pack.get("texts", {})
        reviewed = set(pack.get("reviewed", []))
        texts = {hook: text for hook, text in texts.items() if hook in english or hook in reviewed}
        if again:
            texts = {hook: text for hook, text in texts.items() if hook in reviewed}
        missing = [hook for hook in english if hook not in texts]
        print(f"{listed['code']}: {len(missing)} to translate, {len(texts)} kept", flush=True)
        if missing:
            translate = kept(model(*engine).translate, index.get("keep", []))
            for done, hook in enumerate(missing, 1):
                texts[hook] = translated(translate, english[hook], listed.get("plural", {"other": 2}))
                if done % 25 == 0:
                    print(f"  {done} of {len(missing)}", flush=True)
        pack = {
            "locale": listed["locale"],
            "name": listed["name"],
            "made": "argostranslate " + "-".join(engine),
            "reviewed": sorted(reviewed),
            "texts": {hook: texts[hook] for hook in sorted(texts, key=lambda h: english.get(h, "").lower())},
        }
        path.write_text(json.dumps(pack, ensure_ascii=False, indent="\t") + "\n")
        print(f"{path.relative_to(ROOT)}: {len(pack['texts'])} texts", flush=True)


if __name__ == "__main__":
    arguments = sys.argv[1:]
    # --again: every text that is not reviewed is translated anew (after keep or a model changed)
    main([code.upper() for code in arguments if not code.startswith("--")], "--again" in arguments)
