<script setup>
// the ties of an act as the core draws them (src/core/reading/diagram.ts, /api/.../diagram),
// rendered by mermaid; a click on an act's node opens it. mermaid is big, so it is loaded
// only when an act has ties
import { ref, watch } from "vue";

import { COLOURS } from "../assets/setup.js";

const props = defineProps({ source: { type: String, default: "" } });
const emit = defineEmits(["open"]);
const drawing = ref("");
const failure = ref("");
let count = 0;

// "%% a1 DU/1997/483" lines of the source name the act of each node
const actsOf = (source) =>
	new Map(
		[...source.matchAll(/^\s*%% (a\d+) (\S+)$/gm)].map((m) => [m[1], m[2]]),
	);

watch(
	() => props.source,
	async (source) => {
		drawing.value = "";
		failure.value = "";
		if (!source) return;
		const { default: mermaid } = await import("mermaid");
		const dark = matchMedia("(prefers-color-scheme: dark)").matches;
		mermaid.initialize({
			startOnLoad: false,
			securityLevel: "strict",
			theme: dark ? "dark" : "neutral",
		});
		try {
			const { svg } = await mermaid.render(`ties-${++count}`, source);
			drawing.value = svg;
		} catch (error) {
			failure.value = `the drawing failed: ${error.message}`;
		}
	},
	{ immediate: true },
);

function click(event) {
	const node = event.target.closest("g.node");
	const id = node?.id.match(/flowchart-(a\d+)-/)?.[1];
	const eli = id && actsOf(props.source).get(id);
	if (eli) emit("open", { ELI: eli });
}
</script>

<template>
	<div class="ties-diagram">
		<p v-if="failure" class="has-text-danger is-size-7">{{ failure }}</p>
		<!-- svg made by mermaid with securityLevel strict from labels the core escaped -->
		<div v-else class="drawing" @click="click" v-html="drawing"></div>
	</div>
</template>

<style scoped>
.drawing { overflow-x: auto; }
.drawing :deep(g.node) { cursor: pointer; }
</style>
