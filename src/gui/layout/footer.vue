<script setup>
// where the data comes from and where the project lives, under every screen; "Terms of use"
// opens the licence, the authors and the links (modals/termsdialog.vue)
import { ref } from "vue";
import TermsDialog from "./modals/termsdialog.vue";

const terms = ref(false);
</script>

<template>
	<footer class="footer py-4 has-text-centered is-size-7 has-text-grey">
		<p class="i18n-texts-slot">
			Acts from the ELI API of Sejm, gathered by
			<a
				href="https://github.com/Sarverott/P-jol-roll"
				target="_blank"
				rel="noopener"
				translate="no"
				>P_JOL_ROLL</a
			>
			- open source. Not (formally) legal advices: the journal published by the
			state is the law.
		</p>
		<p class="mt-1">
			<button
				type="button"
				class="button is-ghost is-small i18n-texts-slot"
				@click="terms = true"
			>
				Terms of use
			</button>
		</p>
		<TermsDialog v-model="terms" />
	</footer>
</template>
