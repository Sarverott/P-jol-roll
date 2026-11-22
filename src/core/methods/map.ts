import { createRequire } from "node:module";
import { DirectedGraph } from "graphology";
import log from "../logging/setup.js";
import * as store from "../resources/store.js";
import type { GatheringScope, ReadingScope } from "../vars/interfaces/index.js";
import { edgesTablePath } from "./compile.js";
import { mapPath, PRESETS } from "./presets.js";

// a CommonJS package whose types say "export default": required, so both agree
const forceAtlas2 = createRequire(import.meta.url)(
	"graphology-layout-forceatlas2",
) as typeof import("graphology-layout-forceatlas2").default;

type Node = { title: string; kind: number; x: number; y: number };
type Tie = { tie: number };

/*
The map of the whole law (phase 14): the acts of a preset and the ties among them, placed on a
plane by ForceAtlas2 once, here - a browser (sigma.js) only draws what this wrote into
dataset/map/<preset>.json. All 165 thousand acts with 750 thousand ties are too many for a
page, so a preset takes a part: acts that tie to many others come together, a law and the
acts that carry it out stand near each other.
*/

const short = (title = "") =>
	title.length > 90 ? `${title.slice(0, 87)}...` : title;

export function lawMap(preset: string, iterations = 300): ReadingScope.LawMap {
	const chosen = PRESETS[preset];
	if (!chosen)
		throw new Error(`no preset ${preset}: ${Object.keys(PRESETS).join(", ")}`);
	const graph = new DirectedGraph<Node, Tie>();
	const kinds: string[] = [];
	const ties: string[] = [];
	const years = store.listedYears();
	for (const { publisher, year } of years)
		for (const act of store.readJsonl<GatheringScope.Act>(
			store.listingPath(publisher, year),
		)) {
			if (!chosen.takes(act)) continue;
			const type = String(act.type ?? "");
			if (!kinds.includes(type)) kinds.push(type);
			// the first place on a circle by year, so the layout starts from time
			const angle = ((act.year - 1918) / 110) * 2 * Math.PI;
			graph.addNode(act.ELI, {
				title: short(act.title),
				kind: kinds.indexOf(type),
				x: Math.cos(angle) * 100 + (act.pos % 17),
				y: Math.sin(angle) * 100 + (act.pos % 13),
			});
		}
	for (const { publisher, year } of years)
		for (const edge of store.readJsonl<GatheringScope.Edge>(
			edgesTablePath(publisher, year),
		)) {
			if (edge.from === edge.to) continue;
			if (!graph.hasNode(edge.from) || !graph.hasNode(edge.to)) continue;
			if (graph.hasEdge(edge.from, edge.to)) continue;
			if (!ties.includes(edge.type)) ties.push(edge.type);
			graph.addEdge(edge.from, edge.to, { tie: ties.indexOf(edge.type) });
		}
	forceAtlas2.assign(graph, {
		iterations,
		settings: {
			...forceAtlas2.inferSettings(graph),
			barnesHutOptimize: graph.order > 2000,
		},
	});
	const places = new Map<string, number>();
	const nodes: ReadingScope.LawMap["nodes"] = [];
	graph.forEachNode((eli, node) => {
		places.set(eli, nodes.length);
		const size = 2 + Math.sqrt(graph.degree(eli));
		const round = (value: number) => Math.round(value * 10) / 10;
		nodes.push([
			eli,
			node.title,
			round(node.x),
			round(node.y),
			round(size),
			node.kind,
		]);
	});
	const edges: ReadingScope.LawMap["edges"] = [];
	graph.forEachEdge((_edge, { tie }, from, to) => {
		edges.push([places.get(from) ?? 0, places.get(to) ?? 0, tie]);
	});
	return {
		preset,
		description: chosen.description,
		made: new Date().toISOString(),
		kinds,
		ties,
		nodes,
		edges,
	};
}

// every preset, or the ones named, into dataset/map/
export async function map(presets: string[] = Object.keys(PRESETS)) {
	for (const preset of presets) {
		const started = Date.now();
		const made = lawMap(preset);
		await store.writeWhole(mapPath(preset), JSON.stringify(made));
		log.info(
			`map ${preset}: ${made.nodes.length} acts, ${made.edges.length} ties (${Math.round((Date.now() - started) / 1000)} s)`,
			{ preset, acts: made.nodes.length, ties: made.edges.length },
		);
	}
}
