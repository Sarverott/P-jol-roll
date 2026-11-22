<script setup>
// a failure of the api, in a dialog until it is closed; the viewer goes on with what it has
import { onMounted, onUnmounted } from "vue";

const failure = defineModel({ type: String, default: "" });
const close = () => {
	failure.value = "";
};
// Escape closes it, as the button in it does
const onEscape = (event) => event.key === "Escape" && close();
onMounted(() => addEventListener("keydown", onEscape));
onUnmounted(() => removeEventListener("keydown", onEscape));
</script>

<template>
	<div class="modal" :class="{ 'is-active': failure }">
		<!-- biome-ignore lint/a11y/noStaticElementInteractions: a click beside the dialog closes it; the keyboard has Escape and the button -->
		<!-- biome-ignore lint/a11y/useKeyWithClickEvents: as above -->
		<div class="modal-background" @click="close"></div>
		<div class="modal-content">
			<div
				class="notification is-danger"
				role="alertdialog"
				aria-live="assertive"
			>
				<button
					type="button"
					class="delete i18n-texts-label"
					aria-label="close"
					@click="close"
				></button>
				<p class="i18n-texts-slot">{{ failure }}</p>
			</div>
		</div>
	</div>
</template>
