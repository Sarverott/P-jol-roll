<script setup>
// the ties of the act to other acts: drawn by mermaid (loaded only for an act with ties), and
// as a list of links
import { defineAsyncComponent, inject } from "vue";
import { href } from "../../assets/route.js";

const TiesDiagram = defineAsyncComponent(
	() => import("../ties/TiesDiagram.vue"),
);
const { state } = inject("library");
const openAct = inject("openAct");
</script>

<template>
	<div v-if="state.ties.length">
		<details class="mb-4" open>
			<summary class="i18n-texts-slot">
				{{ state.ties.length }}
				{{ state.ties.length === 1 ? "tie" : "ties" }} to other acts
			</summary>
			<TiesDiagram :source="state.diagram" translate="no" @open="openAct" />
		</details>
		<details class="mb-4">
			<summary class="i18n-texts-slot">the ties as a list</summary>
			<ul class="mt-2" translate="no">
				<li v-for="tie in state.ties" :key="`${tie.type}${tie.to}`">
					{{ tie.type }}: <a :href="href('act', tie.to)">{{ tie.to }}</a>
				</li>
			</ul>
		</details>
	</div>
	<p v-else class="has-text-grey i18n-texts-slot">
		No ties to other acts are named in its details.
	</p>
</template>
