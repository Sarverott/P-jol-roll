import { expect, test } from "vitest";
import { tiesDiagram } from "../src/core/reading/diagram.js";

test("ties are one mermaid flowchart: a group per kind, the rest counted", () => {
	const ties = [
		{ from: "DU/2026/1", type: "Podstawa prawna", to: "DU/1997/483" },
		{ from: "DU/2026/1", type: "Podstawa prawna", to: "DU/1997/483" },
		{ from: "DU/2026/1", type: "Akty zmienione", to: "DU/2020/1" },
		{ from: "DU/2026/1", type: "Akty zmienione", to: "DU/2020/2" },
		{ from: "DU/2026/1", type: "Akty zmienione", to: "DU/2020/3" },
	];
	const titles = new Map([["DU/1997/483", 'Konstytucja "RP"']]);
	expect(tiesDiagram("DU/2026/1", ties, { per: 2, titles })).toBe(
		[
			"flowchart LR",
			'\ta0["DU/2026/1"]:::act',
			'\tsubgraph g1["Podstawa prawna"]',
			'\t\ta1["DU/1997/483<br/>Konstytucja #quot;RP#quot;"]',
			"\tend",
			"\ta0 --> g1",
			"\t%% a1 DU/1997/483",
			'\tsubgraph g2["Akty zmienione"]',
			'\t\ta2["DU/2020/1"]',
			'\t\ta3["DU/2020/2"]',
			'\t\ta4["+1 more"]:::more',
			"\tend",
			"\ta0 --> g2",
			"\t%% a2 DU/2020/1",
			"\t%% a3 DU/2020/2",
			"\tclassDef act fill:#1d2440,color:#f3efe4,stroke:#1d2440",
			"\tclassDef more fill:none,stroke-dasharray:4 3",
			"",
		].join("\n"),
	);
});
