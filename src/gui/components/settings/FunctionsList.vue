<script setup>
// every function of the project (/api/catalog, src/core/catalog): a reading leads to where the
// viewer shows it; a function that gathers or writes is shown as Bulma shows what may not be
// done - disabled - as this host only reads (Q19); its command for a terminal stays beside it
import { computed, inject, onMounted, ref } from "vue";

const GROUPS = {
	read: "read the law",
	gather: "gather from the sources",
	process: "process what is gathered",
	share: "Hugging Face and the demo",
	project: "the project itself",
};
const { ask } = inject("library");
const catalog = ref([]);
onMounted(async () => {
	catalog.value = (await ask("/api/catalog")) ?? [];
});
const grouped = computed(() =>
	Object.entries(GROUPS).map(([group, title]) => ({
		group,
		title,
		functions: catalog.value.filter((one) => one.group === group),
	})),
);
const command = (one) => `task do -- ${one.name}`;
</script>

<template>
	<section class="box">
		<h2 class="title is-6 i18n-texts-slot">Every function</h2>
		<p class="is-size-7 has-text-grey mb-3 i18n-texts-slot">
			What the project can do, the same in every way it runs: the launcher (bare
			"task"), its REPL, "task do", the api, MCP. Functions that gather or write
			files run in a terminal; on this host they are disabled.
		</p>
		<div v-for="part in grouped" :key="part.group" class="mb-4">
			<h3 class="title is-6 has-text-grey i18n-texts-slot">{{ part.title }}</h3>
			<div
				v-for="one in part.functions"
				:key="one.name"
				class="is-flex is-align-items-center is-flex-wrap-wrap mb-1 function-line"
			>
				<a
					v-if="one.allowed && one.ways.viewer?.startsWith('#')"
					class="button is-small is-link is-light mr-2"
					:href="one.ways.viewer"
					translate="no"
					>{{
						one.name
					}}</a
				>
				<button
					v-else
					type="button"
					class="button is-small mr-2"
					:disabled="!one.allowed"
					:title="one.allowed ? '' : 'this host only reads (Q19)'"
					translate="no"
				>
					{{ one.name }}
				</button>
				<span class="mr-2 i18n-texts-slot">{{ one.title }}</span>
				<code class="is-size-7" translate="no">{{ command(one) }}</code>
			</div>
		</div>
	</section>
</template>

<style scoped>
.function-line .button {
	min-width: 10rem;
	justify-content: flex-start;
}
</style>
