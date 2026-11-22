import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { parseHTML } from "linkedom";
import { expect, test } from "vitest";
import { apply, collect, follow } from "../src/i18n/dom.js";
import { hookOf, type Pack, t, templateOf } from "../src/i18n/hooks.js";
import { sha256 } from "../src/i18n/sha256.js";

const pack: Pack = {
	locale: "pl",
	texts: {
		[hookOf("search")]: "szukaj",
		[hookOf("words of title")]: "słowa tytułu",
		[hookOf("Polish journals of laws, as gathered here.")]:
			"Polskie dzienniki praw, zebrane tutaj.",
		[hookOf("1 acts")]: {
			one: "{0} akt",
			few: "{0} akty",
			many: "{0} aktów",
			other: "{0} aktu",
		},
		[hookOf("Ustawa")]: "TO NIE MOŻE BYĆ ZMIENIONE",
	},
};

test("a hook is the SHA-256 of the English with numbers as holes", () => {
	for (const text of ["", "abc", "Zażółć gęślą jaźń", "x".repeat(200)])
		expect(sha256(text)).toBe(createHash("sha256").update(text).digest("hex"));
	expect(templateOf("  115   acts ")).toEqual({
		template: "{0} acts",
		numbers: ["115"],
	});
	expect(hookOf("115 acts")).toBe(hookOf("3 acts"));
	expect(hookOf("115 acts")).toBe(sha256("{0} acts"));
});

test("a terminal asks t(): the pack's text with its numbers and plural, or the English", () => {
	expect(t(pack, "search")).toBe("szukaj");
	expect(t(pack, "1 acts")).toBe("1 akt");
	expect(t(pack, "3 acts")).toBe("3 akty");
	expect(t(pack, "115 acts")).toBe("115 aktów");
	expect(t(pack, " search ")).toBe(" szukaj ");
	expect(t(pack, "not in the pack")).toBe("not in the pack");
	expect(t(undefined, "search")).toBe("search");
});

test("a page is laid over without being rewritten; data and code are never touched", () => {
	const { document } = parseHTML(`<main>
		<p>Polish journals of laws, as gathered here.</p>
		<input placeholder="words of title">
		<button>search</button>
		<p>115 acts</p>
		<article translate="no"><h2>Ustawa</h2></article>
		<code>search</code>
	</main>`);
	const main = document.querySelector("main") as unknown as Node;
	const english = collect(main);
	expect(Object.values(english).sort()).toEqual(
		[
			"Polish journals of laws, as gathered here.",
			"words of title",
			"search",
			"{0} acts",
		].sort(),
	);

	apply(main, pack);
	expect(document.querySelector("p")?.textContent).toBe(
		"Polskie dzienniki praw, zebrane tutaj.",
	);
	expect(document.querySelector("input")?.getAttribute("placeholder")).toBe(
		"słowa tytułu",
	);
	expect(document.querySelector("button")?.textContent).toBe("szukaj");
	expect(document.querySelectorAll("p")[1]?.textContent).toBe("115 aktów");
	expect(document.querySelector("h2")?.textContent).toBe("Ustawa");
	expect(document.querySelector("code")?.textContent).toBe("search");
	// the English is remembered: collected again it is the same, and it comes back
	expect(collect(main)).toEqual(english);
	apply(main, undefined);
	expect(document.querySelector("button")?.textContent).toBe("search");
	expect(document.querySelectorAll("p")[1]?.textContent).toBe("115 acts");
});

test("what the page renders later is laid over too, and a framework's write wins over the old English", async () => {
	// jsdom, as a browser, reports a text node written again (linkedom does not)
	const { window } = new JSDOM("<main><p>3 acts</p></main>");
	const { document } = window;
	const main = document.querySelector("main") as unknown as Node;
	apply(main, pack);
	const stop = follow(main, () => pack, window.MutationObserver);
	const counter = document.querySelector("p")?.firstChild as Text;
	expect(counter.nodeValue).toBe("3 akty");
	counter.nodeValue = "1 acts"; // as Vue patches a text node
	const added = document.createElement("button");
	added.textContent = "search";
	document.querySelector("main")?.appendChild(added);
	await new Promise((done) => setTimeout(done, 20));
	expect(counter.nodeValue).toBe("1 akt");
	expect(added.textContent).toBe("szukaj");
	stop();
});
