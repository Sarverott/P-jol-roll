<script setup>
// what the analysis of the code of law found about the act (phase 36, task analyse): its basis
// or references repealed, amendments waiting for a consolidated text, a Tribunal's judgment
// not followed - each with the improvement it suggests, the acts named as links
import { inject } from "vue";
import { href } from "../../assets/route.js";

const { state } = inject("library");
const KINDS = {
	"basis-repealed": "legal basis repealed",
	"reference-repealed": "refers to a repealed act",
	"consolidation-due": "a consolidated text is due",
	tribunal: "the Tribunal's judgment not followed",
};
</script>

<template>
	<details
		v-if="state.findings.length"
		class="mb-4 box is-shadowless has-background-warning-light"
		open
	>
		<summary class="i18n-texts-slot">
			the analysis found {{ state.findings.length }}
			{{ state.findings.length === 1 ? "thing" : "things" }} to improve
		</summary>
		<div
			v-for="one in state.findings"
			:key="`${one.kind}${one.to}`"
			class="mt-2 is-size-7"
		>
			<p class="has-text-weight-semibold i18n-texts-slot">
				{{ KINDS[one.kind] ?? one.kind }}
			</p>
			<p translate="no">
				<a v-if="one.to" :href="href('act', one.to)">{{ one.to }}</a>
				<template v-if="one.successor">
					&rarr;
					<a :href="href('act', one.successor)">{{
						one.successor
					}}</a></template
				>
			</p>
			<p class="has-text-grey" v-text="one.proposal"></p>
		</div>
	</details>
</template>
