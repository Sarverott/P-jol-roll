<script setup>
// the player of the history: a year on a slider, play and pause, and how many years pass in
// a second - the year is a v-model, so the screen draws what was up to it
import { onUnmounted, ref, watch } from "vue";
import { settings } from "../../assets/settings.js";

const props = defineProps({
	first: { type: Number, default: 1918 },
	last: { type: Number, default: 2026 },
});
const year = defineModel({ type: Number, default: 0 });
const playing = ref(false);
const SPEEDS = [0.5, 1, 2, 5, 10];
let timer;

function stop() {
	playing.value = false;
	clearTimeout(timer);
}

function tick() {
	if (!playing.value) return;
	if (year.value >= props.last) return stop();
	year.value += 1;
	timer = setTimeout(tick, 1000 / settings.speed);
}

function toggle() {
	if (playing.value) return stop();
	// from the start again when it ended
	if (year.value >= props.last) year.value = props.first;
	playing.value = true;
	timer = setTimeout(tick, 1000 / settings.speed);
}

watch(
	() => props.last,
	(last) => {
		if (!year.value) year.value = last;
	},
	{ immediate: true },
);
onUnmounted(stop);
</script>

<template>
	<div class="history-player field is-grouped is-align-items-center">
		<p class="control">
			<button
				type="button"
				class="button is-link is-small i18n-texts-slot"
				@click="toggle"
			>
				{{ playing ? "pause" : "play" }}
			</button>
		</p>
		<p class="control is-expanded">
			<input
				v-model.number="year"
				class="slider i18n-texts-label"
				type="range"
				:min="first"
				:max="last"
				step="1"
				aria-label="year"
				@input="stop"
			>
		</p>
		<p class="control">
			<strong class="is-size-5" translate="no">{{ year }}</strong>
		</p>
		<p class="control">
			<span class="select is-small">
				<select
					v-model.number="settings.speed"
					class="i18n-texts-label"
					aria-label="years per second"
				>
					<option v-for="one in SPEEDS" :key="one" :value="one">
						{{ one }} / s
					</option>
				</select>
			</span>
		</p>
	</div>
</template>

<style scoped>
.slider {
	width: 100%;
}
</style>
