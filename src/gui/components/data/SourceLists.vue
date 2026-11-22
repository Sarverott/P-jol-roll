<script setup>
// the lists of the source, as ELI API gave them: statuses, types of documents, institutions,
// keywords, types of references, journals
import { computed, inject, onMounted, ref, watch } from "vue";

const { ask } = inject("library");
const names = ref([]);
const name = ref("");
const list = ref([]);
const words = ref("");

// a line of a list: a word, or an object shown by its name
const lineOf = (one) =>
	typeof one === "string"
		? one
		: (one.name ?? one.code ?? one.title ?? JSON.stringify(one));
const shown = computed(() => {
	const lines = (Array.isArray(list.value) ? list.value : []).map(lineOf);
	const asked = words.value.toLowerCase();
	return asked
		? lines.filter((line) => line.toLowerCase().includes(asked))
		: lines;
});

onMounted(async () => {
	names.value = (await ask("/api/lists")) ?? [];
	name.value = names.value.includes("statuses")
		? "statuses"
		: (names.value[0] ?? "");
});
watch(name, async (chosen) => {
	list.value = chosen ? ((await ask(`/api/lists/${chosen}`)) ?? []) : [];
});
</script>

<template>
	<section>
		<div class="field is-grouped">
			<div class="control">
				<div class="select is-small" translate="no">
					<select v-model="name" class="i18n-texts-label" aria-label="list">
						<option v-for="one in names" :key="one" :value="one">
							{{ one }}
						</option>
					</select>
				</div>
			</div>
			<div class="control is-expanded">
				<input
					v-model="words"
					class="input is-small i18n-texts-placeholder"
					type="search"
					placeholder="filter"
				>
			</div>
		</div>
		<p class="has-text-grey mb-2 i18n-texts-slot">{{ shown.length }} lines</p>
		<div class="tags list-items" translate="no">
			<span v-for="line in shown" :key="line" class="tag is-medium">{{
				line
			}}</span>
		</div>
	</section>
</template>

<style scoped>
.list-items {
	max-height: 65vh;
	overflow-y: auto;
}
</style>
