<script setup>
// pages of any lines read in pages (the work of Sejm, judgments): first, previous, which of
// how many, next, last - the same as the pages of acts
import { computed } from "vue";

const props = defineProps({
	total: { type: Number, default: 0 },
	offset: { type: Number, default: 0 },
	size: { type: Number, default: 50 },
});
const emit = defineEmits(["go"]);
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)));
const current = computed(() => Math.floor(props.offset / props.size) + 1);
const go = (page) => emit("go", (page - 1) * props.size);
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
		<span class="mx-2">page {{ current }} of {{ pages }}</span>
		<button
			type="button"
			class="button"
			:disabled="current === pages"
			@click="go(current + 1)"
		>
			next
		</button>
		<button
			type="button"
			class="button"
			:disabled="current === pages"
			@click="go(pages)"
		>
			last
		</button>
	</nav>
</template>
