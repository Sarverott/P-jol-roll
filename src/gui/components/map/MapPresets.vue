<script setup>
// the presets of the map (task map makes them), the chosen one bound by v-model, and what the
// map is doing; one not made yet is listed but cannot be chosen
// NOTE: delegate this block of DOM element as component that can be imported so we will be able to work with much more divided code
// ANSWER: done - this component, and MapLegend.vue
const preset = defineModel({ type: String, default: "" });
defineProps({
	presets: { type: Array, default: () => [] },
	state: { type: String, default: "" },
});
</script>

<template>
	<div class="field is-grouped is-align-items-center">
		<div class="control">
			<div class="select">
				<select
					v-model="preset"
					class="i18n-texts-label"
					aria-label="preset of the map"
				>
					<option
						v-for="one in presets"
						:key="one.name"
						:value="one.name"
						:disabled="!one.made"
					>
						{{ one.description }}{{ one.made ? "" : " (not made)" }}
					</option>
				</select>
			</div>
		</div>
		<p class="control has-text-grey is-size-7 i18n-texts-slot">{{ state }}</p>
	</div>
</template>
