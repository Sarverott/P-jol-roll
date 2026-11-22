<script setup>
// the title of the act, its address and status, and its PDFs as the host serves them
import { computed, inject } from "vue";

const { api, state } = inject("library");
const act = computed(() => state.chosen.act);
const pdfs = computed(() =>
	state.chosen.files.filter((ending) => ending.endsWith(".pdf")),
);
const inForce = computed(() => act.value.status === "obowiązujący");
const fileOf = (ending) => `${api}/api/acts/${act.value.ELI}/file/${ending}`;
</script>

<template>
	<div translate="no">
		<h2 class="title is-4">{{ act.title }}</h2>
		<div class="tags">
			<span class="tag is-dark">{{ act.displayAddress ?? act.ELI }}</span>
			<span class="tag is-light" :class="{ 'is-success': inForce }">
				{{ act.status }}
			</span>
			<a
				v-for="ending in pdfs"
				:key="ending"
				class="tag is-link is-light"
				:href="fileOf(ending)"
				target="_blank"
				rel="noopener"
				>{{
					ending
				}}</a
			>
		</div>
	</div>
</template>
