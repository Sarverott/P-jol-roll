<script setup>
// what is in front of the reader (phase 28, the owner's order): the release and the short name
// of the host in the top right corner - "v0.24.3 · HF-demo-readonly-container" - and all of it
// in a note under it on a hover, a focus or a touch. The corner never changes its size, and the
// note takes no pointer, so the note can never cover the corner and keep itself open.
// A page without the api (the static website) shows nothing.
import { computed, inject, onMounted, ref } from "vue";

const api = inject("api", "");
const host = ref(null);
const open = ref(false);

onMounted(async () => {
	const answer = await fetch(`${api}/api/host`).catch(() => undefined);
	if (answer?.ok) host.value = await answer.json();
});

const lines = computed(() => {
	const one = host.value;
	if (!one) return [];
	return [
		`version ${one.version}`,
		[
			one.container ? "docker containered app" : "app run without a container",
			one.production ? "production release" : "development build",
		].join(", "),
		one.huggingface
			? `web interface on Hugging Face (${one.huggingface}) that uses the static dataset`
			: one.remote
				? "web interface that uses the static dataset on Hugging Face"
				: "web interface over the data gathered on this machine",
		[
			one.writing
				? "writing functions start here after a yes"
				: one.huggingface
					? "read-only demo"
					: "read-only",
			one.run ? `produced by the workflow ${one.run}` : "built by hand",
		].join(", "),
		one.commit ? `commit ${one.commit}` : "commit not known",
	];
});
</script>

<template>
	<template v-if="host">
		<button
			type="button"
			class="host-badge"
			translate="no"
			:aria-expanded="open"
			aria-describedby="host-note"
			@click="open = !open"
			@blur="open = false"
		>
			v{{ host.version }} · {{ host.label }}
		</button>
		<div
			id="host-note"
			role="tooltip"
			class="host-note"
			:class="{ 'is-open': open }"
			translate="no"
		>
			<p v-for="line in lines" :key="line">{{ line }}</p>
		</div>
	</template>
</template>

<style scoped>
/* the corner: one size always, whatever it says - longer words are cut, never grown */
.host-badge {
	position: fixed;
	top: 0;
	right: 0;
	z-index: 50;
	box-sizing: border-box;
	width: min(18rem, 100vw);
	height: 1.5rem;
	margin: 0;
	padding: 0 0.6rem;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	text-align: right;
	font: 0.7rem / 1.5rem monospace;
	color: var(--bulma-text-strong, #222);
	background: var(--bulma-scheme-main-bis, #f5f5f5);
	border: 0;
	border-bottom-left-radius: 0.4rem;
	opacity: 0.85;
	cursor: help;
}
/* the note: under the corner, never wider than the screen, and never under the pointer */
.host-note {
	position: fixed;
	top: 1.5rem;
	right: 0;
	z-index: 50;
	box-sizing: border-box;
	width: max-content;
	max-width: 100vw;
	padding: 0.5rem 0.75rem;
	font: 0.75rem / 1.4 monospace;
	overflow-wrap: anywhere;
	color: var(--bulma-text-strong, #222);
	background: var(--bulma-scheme-main-bis, #f5f5f5);
	border-bottom-left-radius: 0.4rem;
	box-shadow: 0 0.3rem 0.8rem rgb(0 0 0 / 20%);
	pointer-events: none;
	visibility: hidden;
}
.host-badge:hover + .host-note,
.host-badge:focus-visible + .host-note,
.host-note.is-open {
	visibility: visible;
}
@media print {
	.host-badge,
	.host-note {
		display: none;
	}
}
</style>
