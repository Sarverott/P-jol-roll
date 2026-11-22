<script setup>
// the work of Sejm: legislative processes and prints of a term, found by words; a process
// that ended with an act leads to it (#act/<ELI>)
import { inject, onMounted, ref, watch } from "vue";
import { href } from "../../assets/route.js";
import DataPager from "./DataPager.vue";

const SIZE = 50;
const { ask } = inject("library");
const terms = ref([]);
const term = ref(0);
const kind = ref("processes");
const words = ref("");
const page = ref({ total: 0, offset: 0, items: [] });

async function load(offset = 0) {
	if (!term.value) return;
	const query = new URLSearchParams({
		q: words.value,
		offset: String(offset),
		limit: String(SIZE),
	});
	page.value = (await ask(
		`/api/sejm/${term.value}/${kind.value}?${query}`,
	)) ?? {
		total: 0,
		offset: 0,
		items: [],
	};
}

onMounted(async () => {
	terms.value = (await ask("/api/sejm")) ?? [];
	term.value = terms.value.at(-1)?.term ?? 0;
});
watch([term, kind], () => load());
</script>

<template>
	<section>
		<p v-if="!terms.length" class="has-text-grey i18n-texts-slot">
			The work of Sejm is not gathered here - "task sejm" gathers it.
		</p>
		<template v-else>
			<div class="field is-grouped is-grouped-multiline">
				<div class="control">
					<div class="select is-small">
						<select
							v-model.number="term"
							class="i18n-texts-label"
							aria-label="term"
						>
							<option v-for="one in terms" :key="one.term" :value="one.term">
								{{ one.term }}
							</option>
						</select>
					</div>
				</div>
				<div class="control">
					<div class="select is-small i18n-texts-slot">
						<select v-model="kind" class="i18n-texts-label" aria-label="kind">
							<option value="processes">legislative processes</option>
							<option value="prints">prints</option>
						</select>
					</div>
				</div>
				<div class="control is-expanded">
					<input
						v-model="words"
						class="input is-small i18n-texts-placeholder"
						type="search"
						placeholder="words of the title"
						@keydown.enter="load()"
					>
				</div>
			</div>
			<p class="has-text-grey mb-2 i18n-texts-slot">{{ page.total }} found</p>
			<div class="list-items" translate="no">
				<div v-for="one in page.items" :key="one.number" class="box p-3 mb-2">
					<strong>{{ one.number }}</strong> {{ one.title }}
					<span class="tags mt-1">
						<span v-if="one.documentType" class="tag">{{
							one.documentType
						}}</span>
						<span v-if="one.documentDate" class="tag is-light">{{
							one.documentDate
						}}</span>
						<span v-if="one.passed" class="tag is-success is-light"
							>passed</span
						>
						<a
							v-if="one.ELI"
							class="tag is-link is-light"
							:href="href('act', one.ELI)"
							>{{
								one.ELI
							}}</a
						>
					</span>
				</div>
			</div>
			<DataPager
				:total="page.total"
				:offset="page.offset"
				:size="SIZE"
				@go="load"
			/>
		</template>
	</section>
</template>

<style scoped>
.list-items {
	max-height: 65vh;
	overflow-y: auto;
}
</style>
