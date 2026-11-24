<script setup>
// the act in Sejm (phase 35): the days of the sittings its bill was read on and who spoke -
// the statements naming its print first, with their words, where their texts are gathered
import { computed, inject } from "vue";

const { state } = inject("library");
const days = computed(() =>
	(state.debates?.days ?? []).map((day) => {
		const about = day.statements.filter((one) => one.about);
		return { ...day, about, others: day.statements.length - about.length };
	}),
);
</script>

<template>
	<div v-if="state.debates?.processes.length" class="mb-4">
		<details open>
			<summary class="i18n-texts-slot">
				in Sejm: {{ days.length }} days of sittings
			</summary>
			<p
				v-for="process in state.debates.processes"
				:key="`${process.term}-${process.number}`"
				class="is-size-7 has-text-grey mt-2"
				translate="no"
			>
				{{ process.term }}/{{ process.number }}: {{ process.title }}
			</p>
			<div
				v-for="day in days"
				:key="`${day.term}-${day.sitting}-${day.date}`"
				class="mt-3"
			>
				<p class="has-text-weight-semibold is-size-7">
					<span translate="no">{{ day.date }}, {{ day.sitting }}.</span>
					<span class="i18n-texts-slot">sitting</span>:
					<span translate="no">{{ day.stage }}</span>
				</p>
				<p v-if="!day.gathered" class="is-size-7 has-text-grey i18n-texts-slot">
					what was said that day is not gathered yet
				</p>
				<ul class="is-size-7">
					<li v-for="one in day.about" :key="one.num" class="mt-1">
						<strong translate="no">{{ one.name }}</strong>
						<span class="has-text-grey" translate="no">
							{{ one.function }} {{ one.club }}</span
						>
						<p class="has-text-grey" v-text="one.text"></p>
					</li>
				</ul>
				<p v-if="day.others" class="is-size-7 has-text-grey i18n-texts-slot">
					{{ day.others }} other statements that day
				</p>
			</div>
		</details>
	</div>
</template>
