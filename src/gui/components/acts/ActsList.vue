<script setup>
// the acts found, each a link to its own screen (#act/<ELI>); titles and snippets are data of
// the source, never translated
import { inject } from "vue";
import { marks } from "../../assets/library.js";
import { href } from "../../assets/route.js";

const { state } = inject("library");
</script>

<template>
	<div class="list-items" translate="no">
		<a
			v-for="act in state.page.items"
			:key="act.ELI"
			:href="href('act', act.ELI)"
			class="box p-3 mb-2 is-block"
			:class="{ 'is-chosen': state.chosen?.act.ELI === act.ELI }"
		>
			<strong>{{ act.ELI }}</strong> {{ act.title }}
			<!-- marks of Typesense around the found words; the rest of the snippet escaped -->
			<span
				v-if="act.snippet"
				class="is-block is-size-7 has-text-grey mt-1"
				v-html="marks(act.snippet)"
			></span>
			<span class="tags mt-1">
				<span class="tag">{{ act.type }}</span>
				<span
					class="tag"
					:class="
						act.status === 'obowiązujący' ? 'is-success is-light' : 'is-light'
					"
					>{{
						act.status
					}}</span
				>
			</span>
		</a>
	</div>
</template>

<style scoped>
.list-items {
	max-height: 75vh;
	overflow-y: auto;
}
.list-items .box {
	color: inherit;
}
.list-items .is-chosen {
	outline: 2px solid var(--bulma-link);
}
</style>
