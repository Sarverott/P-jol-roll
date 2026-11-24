<!-- one answer of the law mastermind: its text with every cited act a link to its page, the
     acts it read and the ones it named from memory, its reasoning folded, the guard's verdict -->
<script setup>
import { computed } from "vue";
import { href } from "../../assets/route.js";

const props = defineProps({
	advice: { type: Object, required: true },
});

/*
The answer as models write it - a little markdown - read line by line into pieces, never as
HTML: "### a heading" a line in bold, "**words**" bold, "[words](address)" its words, every
ELI a link to its act.
*/
const ELI = /((?:DU|MP)\/\d{4}\/\d+)/;
const lines = computed(() =>
	String(props.advice.answer ?? "")
		.split("\n")
		.map((line) => {
			const heading = /^#{1,6}\s+/.test(line);
			// "[DU/1919/147](DU/1919/147)": its words kept, the ELI in them is a link anyway
			const text = line
				.replace(/^#{1,6}\s+/, "")
				.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
			const pieces = text.split("**").flatMap((chunk, i) =>
				chunk
					.split(ELI)
					.filter(Boolean)
					.map((part) => ({
						text: part,
						eli: ELI.test(part) && part.match(ELI)?.[0] === part,
						bold: heading || i % 2 === 1,
					})),
			);
			return { heading, pieces };
		}),
);
</script>

<template>
	<div class="box">
		<div class="answer">
			<div
				v-for="(line, l) in lines"
				:key="l"
				:class="{ 'mt-2': line.heading }"
			>
				<template v-for="(piece, i) in line.pieces" :key="i">
					<a v-if="piece.eli" :href="href('act', piece.text)" translate="no">{{
						piece.text
					}}</a>
					<strong v-else-if="piece.bold">{{ piece.text }}</strong>
					<template v-else>{{ piece.text }}</template>
				</template>
				<br v-if="!line.pieces.length">
			</div>
		</div>
		<div class="tags mt-3 i18n-texts-slot">
			<a
				v-for="one in advice.cited"
				:key="one.ELI"
				:href="href('act', one.ELI)"
				class="tag"
				:class="one.read ? 'is-success is-light' : 'is-warning is-light'"
				:title="
					one.read
						? 'read through the tools'
						: 'not read - the model named it from memory'
				"
				translate="no"
				>{{ one.ELI }}{{ one.read ? "" : " ?" }}</a
			>
		</div>
		<details v-if="advice.thinking" class="mt-2">
			<summary class="is-size-7 i18n-texts-slot">how it reasoned</summary>
			<p class="answer is-size-7 has-text-grey">{{ advice.thinking }}</p>
		</details>
		<details v-if="advice.original" class="mt-2">
			<summary class="is-size-7 i18n-texts-slot">
				as it was said before the translation
			</summary>
			<p class="answer is-size-7 has-text-grey">{{ advice.original }}</p>
		</details>
		<p class="is-size-7 has-text-grey mt-2 i18n-texts-slot">
			<span translate="no">{{ advice.model }}</span>,
			{{ advice.steps?.length ?? 0 }} tool calls<template v-if="advice.guard"
				>, guard: {{ advice.guard.verdict }}</template
			>. Not legal advice.
		</p>
	</div>
</template>

<style scoped>
.answer {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
</style>
