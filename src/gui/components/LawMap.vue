<script setup>
// the map of the whole law (sigma.js): the acts of a preset placed by "task map", the ties among
// them; hovering an act lights its ties, a click opens it. sigma and graphology are loaded
// only when the map is shown
import { onMounted, onUnmounted, ref, watch } from "vue";

import { COLOURS } from "../assets/setup.js";

const props = defineProps({ api: { type: String, default: "" } });
const emit = defineEmits(["open"]);
const presets = ref([]);
const preset = ref("");
const box = ref(null);
const state = ref("");
const kinds = ref([]);
const hovered = ref("");
let renderer;

// const COLOURS = [
// 	"#c0392b",
// 	"#2e86c1",
// 	"#28b463",
// 	"#d68910",
// 	"#8e44ad",
// 	"#17a589",
// 	"#7f8c8d",
// 	"#b9770e",
// 	"#1d2440",
// 	"#e84393",
// ];
const colour = (kind) => COLOURS[kind % COLOURS.length]; // NOTE: instead of making `colour` and `COLOURS` make for example class object ColorPick with static methods and static parameters

async function load() {
	renderer?.kill();
	renderer = undefined;
	if (!preset.value || !box.value) return;
	state.value = "loading the map...";
	const response = await fetch(`${props.api}/api/map/${preset.value}`).catch(
		() => undefined,
	);
	if (!response?.ok) {
		state.value = 'this map is not made here - "task map" makes it';
		return;
	}
	const made = await response.json();
	const [{ default: Graph }, { default: Sigma }] = await Promise.all([
		import(
			"graphology"
		) /* NOTE: no... this is awful, place it at top of script declaration like other imports. why even you consider this? it just by default violates basic rules of how we should work with vue */,
		import("sigma"),
	]);
	const graph = new Graph({ multi: false, type: "directed" }); // NOTE: move it to separed graph script file in assets as simplified creator
	for (const [eli, title, x, y, size, kind] of made.nodes)
		graph.addNode(eli, {
			label: `${eli} ${title}`,
			x,
			y,
			size: Math.min(1 + size * 1.3, 18),
			color: colour(kind),
		});
	for (const [from, to] of made.edges) {
		const a = made.nodes[from][0];
		const b = made.nodes[to][0];
		if (!graph.hasEdge(a, b))
			graph.addEdge(a, b, {
				size: 0.5,
				color:
					"#9aa3b866" /* NOTE: that color should be placed and/or getted from color picker mentioned earlier */,
			});
	}
	kinds.value = made.kinds.map((name, kind) => ({
		name,
		colour: colour(kind),
	}));
	state.value = `${made.nodes.length} acts, ${made.edges.length} ties - ${made.description}; made ${made.made.slice(0, 10)}`;

	let near = new Set();
	renderer = new Sigma(graph, box.value, {
		hideEdgesOnMove: true,
		labelRenderedSizeThreshold: 9,
		labelColor: {
			/* NOTE: just delegate it to color picker in setup.js in assets */
			color: matchMedia("(prefers-color-scheme: dark)").matches
				? "#ddd" /* NOTE: that color should be placed and/or getted from color picker mentioned earlier */
				: "#222" /* NOTE: that color should be placed and/or getted from color picker mentioned earlier */,
		},
		nodeReducer: (node, data) =>
			hovered.value && !near.has(node)
				? {
						...data,
						color:
							"#c9ced8" /* NOTE: that color should be placed and/or getted from color picker mentioned earlier */,
						label: "",
					}
				: data,
		edgeReducer: (edge, data) =>
			hovered.value && !graph.extremities(edge).includes(hovered.value)
				? { ...data, visibility: "hidden" } // sigma 4: "hidden" of sigma 3 is gone
				: hovered.value
					? { ...data, color: "#c0392b", size: 1.5 }
					: data,
	});
	/* NOTE: too dense, move functions of events above load function and replace these listeners below like that: renderer.on("{eventname}", {eventname}Action) */
	renderer.on("enterNode", ({ node }) => {
		hovered.value = node;
		near = new Set([node, ...graph.neighbors(node)]);
		renderer.refresh();
	});
	renderer.on("leaveNode", () => {
		hovered.value = "";
		near = new Set();
		renderer.refresh();
	});
	renderer.on("clickNode", ({ node }) => emit("open", { ELI: node }));
	// for tests and the console: the renderer of this map
	box.value.sigma = renderer;
}

onMounted(async () => {
	const answer = await fetch(`${props.api}/api/map`).catch(() => undefined);
	presets.value = answer?.ok ? await answer.json() : [];
	preset.value =
		presets.value.find((one) => one.made)?.name ?? presets.value[0]?.name ?? "";
});
watch(preset, load, { flush: "post" });
onUnmounted(() => renderer?.kill());
</script>

<template>
	<section class="law-map">
		<div class="field is-grouped is-align-items-center"> <!-- NOTE: delegate this block of DOM element as component that can be imported so we will be able to work with much more divided code -->
			<div class="control">
				<div class="select">
					<select v-model="preset" aria-label="preset of the map">
						<option v-for="one in presets" :key="one.name" :value="one.name" :disabled="!one.made">
							{{ one.description }}{{ one.made ? "" : " (not made)" }}
						</option>
					</select>
				</div>
			</div>
			<p class="control has-text-grey is-size-7">{{ state }}</p>
		</div>
		<div class="tags" translate="no"> <!-- NOTE: delegate this block of DOM element as component that can be imported so we will be able to work with much more divided code -->
			<span v-for="kind in kinds" :key="kind.name" class="tag is-outlined">
				<span class="dot" :style="{ background: kind.colour }"></span>{{ kind.name }}
			</span>
		</div>
		<div ref="box" class="plane box p-0"></div>
		<p class="is-size-7 has-text-grey">Hover an act to see its ties, click it to open it. Acts that tie to many others are bigger.</p>
	</section>
</template>

<style scoped>
.plane { /* NOTE: i can spot that we have not configured properly biomejs - please make it automated at every post-commit, pre-merge and pre-push do at least formatting work */
	width: 100%; 
	height: 70vh; 
}
.dot { 
	display: inline-block; 
	width: 0.6rem; 
	height: 0.6rem; 
	border-radius: 50%; 
	margin-right: 0.35rem; 
}
</style>
