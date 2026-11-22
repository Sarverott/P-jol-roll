<!-- numbers of the whole, and the history of the law played year by year: the histogram grows, the
types and statuses of the acts published up to that year change with it -->
<script setup>
import { computed, inject, onMounted, ref } from "vue";
import { journalsOf, upTo, yearsOf } from "../assets/counting.js";
import HistoryPlayer from "../components/plots/HistoryPlayer.vue";
import RankBars from "../components/plots/RankBars.vue";
import YearBars from "../components/plots/YearBars.vue";

const { state, loadStatistics } = inject("library");
const journal = ref("");
const year = ref(0);
onMounted(loadStatistics);

const years = computed(() => yearsOf(state.statistics, journal.value));
const first = computed(() => years.value[0]?.year ?? 1918);
const last = computed(() => years.value.at(-1)?.year ?? 2026);
const whole = computed(() => upTo(years.value));
const until = computed(() => upTo(years.value, year.value));
const thisYear = computed(() =>
	years.value.find((one) => one.year === year.value),
);
const IN_FORCE = "obowiązujący";

const tiles = computed(() => [
	{ title: "acts gathered", value: whole.value.acts },
	{ title: "years", value: years.value.length },
	{ title: "in force today", value: whole.value.statuses[IN_FORCE] ?? 0 },
	{ title: "types of acts", value: Object.keys(whole.value.types).length },
	{ title: "journals", value: journalsOf(state.statistics).length },
	{ title: "first year", value: first.value, plain: true },
]);
</script>

<template>
	<section>
		<p
			v-if="!state.statistics?.years.length"
			class="has-text-grey i18n-texts-slot"
		>
			Nothing counted here yet - "task stats" counts the acts.
		</p>
		<template v-else>
			<div class="columns is-multiline is-mobile">
				<div
					v-for="tile in tiles"
					:key="tile.title"
					class="column is-half-mobile is-2-desktop"
				>
					<div class="box has-text-centered p-3">
						<p class="heading i18n-texts-slot">{{ tile.title }}</p>
						<p class="title is-5" translate="no">
							{{ tile.plain ? tile.value : tile.value.toLocaleString() }}
						</p>
					</div>
				</div>
			</div>
			<p class="is-size-7 has-text-grey i18n-texts-slot">
				Counted {{ state.statistics.made.slice(0, 10) }}, from the listings of
				the journals gathered here.
			</p>
			<h2 class="title is-6 mt-4 i18n-texts-slot">The law year by year</h2>
			<div class="field">
				<div class="select is-small" translate="no">
					<select
						v-model="journal"
						class="i18n-texts-label"
						aria-label="journal"
					>
						<option value="">DU + MP</option>
						<option
							v-for="one in journalsOf(state.statistics)"
							:key="one"
							:value="one"
						>
							{{ one }}
						</option>
					</select>
				</div>
			</div>
			<HistoryPlayer v-model="year" :first="first" :last="last" />
			<YearBars :years="years" :up-to="year" />
			<div class="columns mt-2">
				<div class="column">
					<p class="i18n-texts-slot">
						Up to {{ year }}: {{ until.acts.toLocaleString() }} acts published;
						in {{ year }} alone: {{ (thisYear?.value ?? 0).toLocaleString() }}.
					</p>
					<h3 class="title is-6 mt-3 i18n-texts-slot">
						Types published up to then
					</h3>
					<RankBars :counts="until.types" :top="8" />
				</div>
				<div class="column">
					<h3 class="title is-6 i18n-texts-slot">Their status today</h3>
					<RankBars :counts="until.statuses" :top="8" />
				</div>
			</div>
		</template>
	</section>
</template>
