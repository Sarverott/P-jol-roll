<!-- one act on a screen of its own: its text, and its ties along it -->
<script setup>
import { inject } from "vue";
import { href } from "../assets/route.js";
import ActDebates from "../components/act/ActDebates.vue";
import ActFindings from "../components/act/ActFindings.vue";
import ActHeader from "../components/act/ActHeader.vue";
import ActText from "../components/act/ActText.vue";
import ActTies from "../components/act/ActTies.vue";
import AsideRight from "../layout/aside-right.vue";

const { state } = inject("library");
</script>

<template>
	<div v-if="state.chosen" class="columns">
		<article class="column act">
			<ActHeader />
			<ActText />
		</article>
		<AsideRight>
			<ActFindings />
			<ActTies />
			<ActDebates />
		</AsideRight>
	</div>
	<p v-else class="has-text-grey i18n-texts-slot">
		Choose an act on the <a :href="href('acts')">list of acts</a>.
	</p>
</template>

<style scoped>
.act {
	min-width: 0;
	overflow-wrap: anywhere;
}
</style>
