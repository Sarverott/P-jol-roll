<!-- common tabs of all screens available -->
<script setup>
// the screens as tabs, each a link of its own (assets/route.js); the tab of an act leads to
// the one chosen last, and waits until one is
import { href } from "../assets/route.js";

defineProps({
	screen: { type: String, default: "acts" },
	chosen: { type: String, default: "" },
});
const MORE = [
	{ screen: "map", title: "map of the whole law" },
	{ screen: "ask", title: "ask the law" },
	{ screen: "data", title: "Sejm, judgments, lists" },
	{ screen: "plots", title: "plots" },
	{ screen: "statistics", title: "statistics and history" },
	{ screen: "settings", title: "settings" },
];
</script>

<template>
	<nav class="tabs">
		<ul class="i18n-texts-slot">
			<li :class="{ 'is-active': screen === 'acts' }">
				<a :href="href('acts')">acts</a>
			</li>
			<li v-if="chosen" :class="{ 'is-active': screen === 'act' }">
				<a :href="href('act', chosen)"
					>the act <span class="ml-1" translate="no">{{ chosen }}</span></a
				>
			</li>
			<li
				v-for="one in MORE"
				:key="one.screen"
				:class="{ 'is-active': screen === one.screen }"
			>
				<a :href="href(one.screen)">{{ one.title }}</a>
			</li>
		</ul>
	</nav>
</template>
