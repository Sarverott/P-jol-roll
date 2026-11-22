<script setup>
// the kinds of acts on the map with their colours (ColorPick.kind); names of the source, so
// they are not translated
// NOTE: delegate this block of DOM element as component that can be imported so we will be able to work with much more divided code
// ANSWER: done - this component, and MapPresets.vue
defineProps({ kinds: { type: Array, default: () => [] } });
</script>

<template>
	<div class="tags" translate="no">
		<span v-for="kind in kinds" :key="kind.name" class="tag is-outlined">
			<span class="dot" :style="{ background: kind.colour }"></span>
			{{ kind.name }}
		</span>
	</div>
</template>

<style scoped>
.dot {
	display: inline-block;
	width: 0.6rem;
	height: 0.6rem;
	border-radius: 50%;
	margin-right: 0.35rem;
}
</style>
