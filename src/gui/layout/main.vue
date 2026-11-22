<script setup>
// the body of the viewer: the tabs of the screens, a notice of the host, then the screen
import ScreenTabs from "../components/ScreenTabs.vue";

defineProps({
	screen: { type: String, default: "acts" },
	chosen: { type: String, default: "" },
	notice: { type: String, default: "" },
});
</script>

<template>
	<div class="section pt-4">
		<ScreenTabs :screen="screen" :chosen="chosen" />
		<div
			v-if="notice"
			class="notification is-success is-light py-2 i18n-texts-slot"
		>
			{{ notice }}
		</div>
		<slot></slot>
	</div>
</template>
