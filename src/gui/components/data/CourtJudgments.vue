<script setup>
// court judgments of SAOS, a month at a time, found by words
import { inject, onMounted, ref, watch } from "vue";
import DataPager from "./DataPager.vue";

const SIZE = 50;
const { ask } = inject("library");
const months = ref([]);
const month = ref("");
const words = ref("");
const page = ref({ total: 0, offset: 0, items: [] });

// what a judgment is called: its case numbers, else its number in SAOS
const nameOf = (one) =>
	one.courtCases?.map((court) => court.caseNumber).join(", ") || `#${one.id}`;
const textOf = (one) =>
	String(one.textContent ?? "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.slice(0, 240);

async function load(offset = 0) {
	if (!month.value) return;
	const [year, number] = month.value.split("-");
	const query = new URLSearchParams({
		q: words.value,
		offset: String(offset),
		limit: String(SIZE),
	});
	page.value = (await ask(
		`/api/judgments/${year}/${Number(number)}?${query}`,
	)) ?? { total: 0, offset: 0, items: [] };
}

onMounted(async () => {
	months.value = (await ask("/api/judgments")) ?? [];
	month.value = months.value.at(-1) ?? "";
});
watch(month, () => load());
</script>

<template>
	<section>
		<p v-if="!months.length" class="has-text-grey i18n-texts-slot">
			Court judgments are not gathered here - "task saos" gathers them.
		</p>
		<template v-else>
			<div class="field is-grouped">
				<div class="control">
					<div class="select is-small" translate="no">
						<select v-model="month" class="i18n-texts-label" aria-label="month">
							<option v-for="one in months" :key="one" :value="one">
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
						placeholder="words of the judgment"
						@keydown.enter="load()"
					>
				</div>
			</div>
			<p class="has-text-grey mb-2 i18n-texts-slot">{{ page.total }} found</p>
			<div class="list-items" translate="no">
				<div v-for="one in page.items" :key="one.id" class="box p-3 mb-2">
					<strong>{{ nameOf(one) }}</strong>
					<span class="tags mt-1">
						<span v-if="one.judgmentDate" class="tag is-light">{{
							one.judgmentDate
						}}</span>
						<span v-if="one.courtType" class="tag">{{ one.courtType }}</span>
						<span v-if="one.judgmentType" class="tag">{{
							one.judgmentType
						}}</span>
					</span>
					<p class="is-size-7 has-text-grey mt-1">{{ textOf(one) }}</p>
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
