<script setup>
// the controls of the map: zoom in and out, the whole map again, and an act found by its ELI
// or words of its title - LawMap.vue moves the camera to it and lights its ties
import { computed, ref } from "vue";

const props = defineProps({
	// [eli, label] of every act on the map
	acts: { type: Array, default: () => [] },
});
const emit = defineEmits(["zoomIn", "zoomOut", "fit", "find"]);
const words = ref("");

// the first acts whose ELI or title has every word typed
const found = computed(() => {
	const asked = words.value.toLowerCase().split(/\s+/).filter(Boolean);
	if (!asked.length) return [];
	return props.acts
		.filter(([, label]) =>
			asked.every((word) => label.toLowerCase().includes(word)),
		)
		.slice(0, 30);
});

function find() {
	const exact = props.acts.find(([eli]) => eli === words.value.trim());
	const first = exact ?? found.value[0];
	if (first) emit("find", first[0]);
}
</script>

<template>
	<div class="field has-addons is-flex-wrap-wrap map-controls">
		<p class="control">
			<button
				type="button"
				class="button is-small i18n-texts-label"
				aria-label="zoom in"
				title="zoom in"
				@click="emit('zoomIn')"
			>
				+
			</button>
		</p>
		<p class="control">
			<button
				type="button"
				class="button is-small i18n-texts-label"
				aria-label="zoom out"
				title="zoom out"
				@click="emit('zoomOut')"
			>
				−
			</button>
		</p>
		<p class="control">
			<button
				type="button"
				class="button is-small i18n-texts-slot"
				@click="emit('fit')"
			>
				whole map
			</button>
		</p>
		<p class="control is-expanded">
			<input
				v-model="words"
				class="input is-small i18n-texts-placeholder"
				type="search"
				list="map-acts"
				placeholder="find an act: DU/2026/1 or words of its title"
				@keydown.enter="find"
				@change="find"
			>
			<datalist id="map-acts">
				<option v-for="[ eli, label ] in found" :key="eli" :value="eli">
					{{ label }}
				</option>
			</datalist>
		</p>
		<p class="control">
			<button
				type="button"
				class="button is-small is-link i18n-texts-slot"
				:disabled="!words.trim()"
				@click="find"
			>
				find
			</button>
		</p>
	</div>
</template>

<style scoped>
.map-controls {
	max-width: 48rem;
}
</style>
