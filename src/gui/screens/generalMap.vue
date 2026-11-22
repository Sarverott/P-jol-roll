<!-- map of all law of poland (that huge graph viewer) -->
<script setup>
// sigma and graphology come with LawMap, so it is loaded only when this screen is shown
import { defineAsyncComponent, inject } from "vue";

const LawMap = defineAsyncComponent(
	() => import("../components/map/LawMap.vue"),
);
const { api } = inject("library");
const openAct = inject("openAct");
</script>

<template>
	<LawMap :api="api" @open="openAct" />
</template>
