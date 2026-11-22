<script setup>
// the map of the whole law (sigma.js): the acts of a preset placed by "task map", the ties among
// them; hovering an act lights its ties, a click opens it. The screen of the map loads this
// component only when the map is shown (defineAsyncComponent), so sigma and graphology come
// with it and not with the first page
//
// NOTE: no... this is awful, place it at top of script declaration like other imports. why even you consider this? it just by default violates basic rules of how we should work with vue
// ANSWER: done - every import is on top; what is heavy is held back the Vue way, by the parent
// loading this component lazily (screens/generalMap.vue), not by import() inside a function
// NOTE: too dense, move functions of events above load function and replace these listeners below like that: renderer.on("{eventname}", {eventname}Action)
// ANSWER: done - enterNodeAction, leaveNodeAction, clickNodeAction and the reducers above load()
import Sigma from "sigma";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { kindsOf, lawGraph } from "../../assets/graph.js";
import { ColorPick } from "../../assets/setup.js";
import MapLegend from "./MapLegend.vue";
import MapPresets from "./MapPresets.vue";

const props = defineProps({ api: { type: String, default: "" } });
const emit = defineEmits(["open"]);
const presets = ref([]);
const preset = ref("");
const box = ref(null);
const state = ref("");
const kinds = ref([]);
const hovered = ref("");
let renderer;
let graph;
// the act under the pointer and its neighbours
let near = new Set();

function enterNodeAction({ node }) {
	hovered.value = node;
	near = new Set([node, ...graph.neighbors(node)]);
	renderer.refresh();
}

function leaveNodeAction() {
	hovered.value = "";
	near = new Set();
	renderer.refresh();
}

function clickNodeAction({ node }) {
	emit("open", { ELI: node });
}

// acts away from the one under the pointer fade, and lose their labels
function nodeReducer(node, data) {
	return hovered.value && !near.has(node)
		? { ...data, color: ColorPick.named("dimmed"), label: "" }
		: data;
}

// only the ties of the act under the pointer, lit
function edgeReducer(edge, data) {
	if (!hovered.value) return data;
	return graph.extremities(edge).includes(hovered.value)
		? { ...data, color: ColorPick.named("lit"), size: 1.5 }
		: { ...data, visibility: "hidden" }; // sigma 4: "hidden" of sigma 3 is gone
}

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
	graph = lawGraph(made);
	kinds.value = kindsOf(made);
	state.value = `${made.nodes.length} acts, ${made.edges.length} ties - ${made.description}; made ${made.made.slice(0, 10)}`;
	near = new Set();
	renderer = new Sigma(graph, box.value, {
		hideEdgesOnMove: true,
		labelRenderedSizeThreshold: 9,
		labelColor: { color: ColorPick.label() },
		nodeReducer,
		edgeReducer,
	});
	renderer.on("enterNode", enterNodeAction);
	renderer.on("leaveNode", leaveNodeAction);
	renderer.on("clickNode", clickNodeAction);
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
		<MapPresets v-model="preset" :presets="presets" :state="state" />
		<MapLegend :kinds="kinds" />
		<div ref="box" class="plane box p-0"></div>
		<p class="is-size-7 has-text-grey i18n-texts-slot">
			Hover an act to see its ties, click it to open it. Acts that tie to many
			others are bigger.
		</p>
	</section>
</template>

<style scoped>
/* NOTE: i can spot that we have not configured properly biomejs - please make it automated at every post-commit, pre-merge and pre-push do at least formatting work */
/* ANSWER: done - Biome formats in pre-commit and pre-merge-commit and checks in pre-push (.husky/README.md); it formats the styles and templates of .vue and .astro too */
.plane {
	width: 100%;
	height: 70vh;
}
</style>
