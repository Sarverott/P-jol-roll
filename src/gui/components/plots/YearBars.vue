<script setup>
// a histogram of years: a bar per year, as high as its value; years after "upTo" stay empty,
// so the history (statisticsHistory.vue) grows it year by year; the year "upTo" is lit
import { computed } from "vue";
import { ColorPick } from "../../assets/setup.js";

const props = defineProps({
	// [{ year, value }] in order of years
	years: { type: Array, default: () => [] },
	upTo: { type: Number, default: 0 },
	label: { type: String, default: "" },
});
const WIDTH = 800;
const HEIGHT = 220;
const BOTTOM = 18;
const most = computed(() =>
	Math.max(1, ...props.years.map((one) => one.value)),
);
const step = computed(() => WIDTH / Math.max(1, props.years.length));
const bars = computed(() =>
	props.years.map((one, i) => {
		const shown = !props.upTo || one.year <= props.upTo;
		const height = shown ? ((HEIGHT - BOTTOM) * one.value) / most.value : 0;
		return {
			...one,
			x: i * step.value,
			y: HEIGHT - BOTTOM - height,
			height,
			lit: one.year === props.upTo,
		};
	}),
);
// a year written under every tenth
const ticks = computed(() => bars.value.filter((one) => one.year % 10 === 0));
const colour = (lit) => ColorPick.named(lit ? "lit" : "brand");
</script>

<template>
	<figure class="year-bars">
		<svg
			:viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
			role="img"
			:aria-label="label"
			preserveAspectRatio="none"
		>
			<title>{{ label || "acts per year" }}</title>
			<rect
				v-for="one in bars"
				:key="one.year"
				:x="one.x"
				:y="one.y"
				:width="Math.max(1, step - 1)"
				:height="one.height"
				:fill="colour(one.lit)"
			>
				<title>{{ one.year }}: {{ one.value }}</title>
			</rect>
			<text
				v-for="one in ticks"
				:key="`t${one.year}`"
				:x="one.x"
				:y="HEIGHT - 4"
				class="tick"
			>
				{{ one.year }}
			</text>
		</svg>
		<figcaption v-if="label" class="is-size-7 has-text-grey">
			{{ label }}
		</figcaption>
	</figure>
</template>

<style scoped>
.year-bars svg {
	width: 100%;
	height: 14rem;
}
.tick {
	font-size: 11px;
	fill: currentColor;
	opacity: 0.6;
}
</style>
