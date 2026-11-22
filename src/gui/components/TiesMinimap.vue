<script setup>
// a minimap of the ties in the corner: the act in the middle, the acts it ties to around it,
// a colour per kind of tie (Cytoscape.js); a click on an act opens it
import { onUnmounted, ref, watch } from "vue";

const props = defineProps({
	eli: { type: String, default: "" },
	ties: { type: Array, default: () => [] },
});
const emit = defineEmits(["open"]);
const box = ref(null);
const folded = ref(false);
let graph;

const COLOURS = [
	"#c0392b",
	"#2e86c1",
	"#28b463",
	"#d68910",
	"#8e44ad",
	"#17a589",
	"#7f8c8d",
];

async function draw() {
	graph?.destroy();
	graph = undefined;
	if (!box.value || !props.eli || !props.ties.length || folded.value) return;
	const { default: cytoscape } = await import("cytoscape");
	const kinds = [...new Set(props.ties.map((tie) => tie.type))];
	const targets = [...new Set(props.ties.map((tie) => tie.to))];
	graph = cytoscape({
		container: box.value,
		elements: [
			{ data: { id: props.eli, label: props.eli }, classes: "act" },
			...targets.map((to) => ({ data: { id: to, label: to } })),
			...props.ties.map((tie, at) => ({
				data: {
					id: `e${at}`,
					source: props.eli,
					target: tie.to,
					colour: COLOURS[kinds.indexOf(tie.type) % COLOURS.length],
				},
			})),
		],
		style: [
			{
				selector: "node",
				style: {
					width: 8,
					height: 8,
					"background-color": "#5f6b8a",
					label: targets.length <= 12 ? "data(label)" : "",
					"font-size": 7,
					color: "#888",
				},
			},
			{
				selector: "node.act",
				style: {
					width: 14,
					height: 14,
					"background-color": "#1d2440",
					label: "data(label)",
				},
			},
			{
				selector: "edge",
				style: { width: 1, "line-color": "data(colour)", opacity: 0.7 },
			},
		],
		layout: {
			name: "concentric",
			concentric: (node) => (node.hasClass("act") ? 2 : 1),
			minNodeSpacing: 4,
		},
		// a few ties must not fill the box with two giant dots
		maxZoom: 1.5,
		userZoomingEnabled: true,
		boxSelectionEnabled: false,
	});
	graph.on("tap", "node", (event) => {
		const id = event.target.id();
		if (id !== props.eli) emit("open", { ELI: id });
	});
}

watch(() => [props.eli, props.ties, folded.value], draw, { flush: "post" });
onUnmounted(() => graph?.destroy());
</script>

<template>
	<aside v-if="ties.length" class="minimap box p-2">
		<p class="is-size-7 has-text-grey is-flex is-justify-content-space-between">
			<span>{{ ties.length }} {{ ties.length === 1 ? "tie" : "ties" }}</span>
			<a href="#" @click.prevent="folded = !folded">{{ folded ? "show" : "hide" }}</a>
		</p>
		<div v-show="!folded" ref="box" class="graph"></div>
	</aside>
</template>

<style scoped>
.minimap { position: fixed; right: 1rem; bottom: 1rem; width: 16rem; z-index: 30; margin: 0; }
.graph { width: 100%; height: 12rem; }
@media (max-width: 48rem) { .minimap { width: 11rem; } .graph { height: 8rem; } }
</style>
