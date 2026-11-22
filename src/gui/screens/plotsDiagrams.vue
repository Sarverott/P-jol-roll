<!-- the acts in plots: per year, by type, by status - of one journal or of both -->
<script setup>
import { computed, inject, onMounted, ref } from "vue";
import { journalsOf, upTo, yearsOf } from "../assets/counting.js";
import RankBars from "../components/plots/RankBars.vue";
import YearBars from "../components/plots/YearBars.vue";

const { state, loadStatistics } = inject("library");
const journal = ref("");
onMounted(loadStatistics);

const years = computed(() => yearsOf(state.statistics, journal.value));
const whole = computed(() => upTo(years.value));
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
			<h2 class="title is-6 i18n-texts-slot">Acts per year</h2>
			<YearBars :years="years" />
			<div class="columns mt-4">
				<div class="column">
					<h2 class="title is-6 i18n-texts-slot">By type</h2>
					<RankBars :counts="whole.types" />
				</div>
				<div class="column">
					<h2 class="title is-6 i18n-texts-slot">By status</h2>
					<RankBars :counts="whole.statuses" />
				</div>
			</div>
		</template>
	</section>
</template>
