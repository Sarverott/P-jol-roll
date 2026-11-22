<script setup>
// the pages of what was found: the first, the one before, which one of how many, the next,
// the last
import { computed, inject } from "vue";
import { PAGE } from "../../assets/library.js";

const { state, loadActs } = inject("library");
const pages = computed(() => Math.max(1, Math.ceil(state.page.total / PAGE)));
const current = computed(() => Math.floor(state.page.offset / PAGE) + 1);
const go = (page) => loadActs((page - 1) * PAGE);
</script>

<template>
	<nav
		class="buttons are-small mt-3 is-align-items-center i18n-texts-slot"
		aria-label="pages"
	>
		<button
			type="button"
			class="button"
			:disabled="current === 1"
			@click="go(1)"
		>
			first
		</button>
		<button
			type="button"
			class="button"
			:disabled="current === 1"
			@click="go(current - 1)"
		>
			previous
		</button>
		<span class="mx-2 mb-2 has-text-grey"
			>page {{ current }} of {{ pages }}</span
		>
		<button
			type="button"
			class="button"
			:disabled="current >= pages"
			@click="go(current + 1)"
		>
			next
		</button>
		<button
			type="button"
			class="button"
			:disabled="current >= pages"
			@click="go(pages)"
		>
			last
		</button>
	</nav>
</template>
