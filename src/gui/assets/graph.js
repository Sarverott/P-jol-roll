import Graph from "graphology";
import { ColorPick } from "./setup.js";

/*
The graph of a map made by "task map" (dataset/map/<preset>.json, /api/map/<preset>): an act
per node, placed where ForceAtlas2 put it, coloured by its kind; a tie per edge, one per pair.
  nodes: [eli, title, x, y, size, kind]    edges: [from, to] as indexes of nodes
*/
// NOTE: move it to separed graph script file in assets as simplified creator
// ANSWER: done - lawGraph(made) here; LawMap.vue only shows what it gives

const BIGGEST = 18;

export function lawGraph(made) {
	const graph = new Graph({ multi: false, type: "directed" });
	for (const [eli, title, x, y, size, kind] of made.nodes)
		graph.addNode(eli, {
			label: `${eli} ${title}`,
			x,
			y,
			size: Math.min(1 + size * 1.3, BIGGEST),
			color: ColorPick.kind(kind),
		});
	for (const [from, to] of made.edges) {
		const a = made.nodes[from][0];
		const b = made.nodes[to][0];
		if (!graph.hasEdge(a, b))
			graph.addEdge(a, b, { size: 0.5, color: ColorPick.named("edge") });
	}
	return graph;
}

// the kinds of a map with their colours, for its legend
export const kindsOf = (made) =>
	made.kinds.map((name, kind) => ({ name, colour: ColorPick.kind(kind) }));
