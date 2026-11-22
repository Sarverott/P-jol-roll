<script setup>
// the text of the act as markdown made by "task text": from its HTML, or from the text layer
// of its PDF - then a warning says so, as old scans are recognised with mistakes
import { inject } from "vue";

const { state } = inject("library");
</script>

<template>
	<div>
		<div
			v-if="state.text && state.chosen.text?.from === 'pdf'"
			class="notification is-warning is-light py-2 origin i18n-texts-slot"
		>
			Text read from the PDF<template
				v-if="/Paper Capture/.test(state.chosen.text.producer ?? '')"
				>, recognised from a scan of the printed journal</template
			>: it is not corrected and may hold mistakes - the
			<a :href="state.chosen.text.url" target="_blank" rel="noopener"
				>PDF at the source</a
			>
			is the text.
		</div>
		<div
			v-if="state.text"
			class="content"
			translate="no"
			v-html="state.text"
		></div>
		<p v-else class="has-text-grey i18n-texts-slot">
			No markdown of this act here: "task text" was not run for it, or its PDF
			is a scan without text.
		</p>
	</div>
</template>

<style scoped>
.origin {
	font-size: 0.9rem;
}
</style>
