<script setup>
// every function of the project (/api/catalog, src/core/catalog): a reading leads to where the
// viewer shows it; a function that gathers or writes is shown as Bulma shows what may not be
// done - disabled - unless this host runs on this machine with --allow-writing (Q19, phase 25):
// then it starts as a job after the person says yes, and its lines are followed here.
// Its command for a terminal stays beside it either way.
import { computed, inject, onMounted, onUnmounted, ref } from "vue";

const GROUPS = {
	read: "read the law",
	gather: "gather from the sources",
	process: "process what is gathered",
	share: "Hugging Face and the demo",
	project: "the project itself",
};
const library = inject("library");
const catalog = ref([]);
onMounted(async () => {
	catalog.value = (await library.ask("/api/catalog")) ?? [];
});
const grouped = computed(() =>
	Object.entries(GROUPS).map(([group, title]) => ({
		group,
		title,
		functions: catalog.value.filter((one) => one.group === group),
	})),
);
const writing = computed(() =>
	catalog.value.some((one) => one.writes && one.allowed),
);
const command = (one) => `task do -- ${one.name}`;

// the function chosen to start, its words (as for "task do"), and the job that runs
const chosen = ref(null);
const words = ref("");
const job = ref(null);
const failure = ref("");
let polling;

const hint = (one) =>
	one.params
		.map((param) =>
			param.kind === "flag" ? `--${param.option ?? param.name}` : param.name,
		)
		.join(" ");

function choose(one) {
	chosen.value = chosen.value === one ? null : one;
	words.value = "";
	failure.value = "";
}

async function follow(id) {
	clearTimeout(polling);
	const response = await fetch(`${library.api}/api/jobs/${id}`);
	if (!response.ok) return;
	job.value = await response.json();
	if (job.value.state === "running")
		polling = setTimeout(() => follow(id), 1000);
}

async function start(one) {
	failure.value = "";
	const said = words.value.trim();
	const line = `${command(one)}${said ? ` ${said}` : ""}`;
	if (
		!window.confirm(
			`Start "${one.name}" on this machine? It writes: ${one.title}.\n\n${line}`,
		)
	)
		return;
	const response = await fetch(`${library.api}/api/jobs`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: one.name,
			words: said ? said.split(/\s+/) : [],
			yes: true,
		}),
	});
	const answer = await response.json().catch(() => ({}));
	if (!response.ok) {
		failure.value = answer.error ?? `${response.status}`;
		return;
	}
	chosen.value = null;
	follow(answer.id);
}

onUnmounted(() => clearTimeout(polling));
</script>

<template>
	<section class="box">
		<h2 class="title is-6 i18n-texts-slot">Every function</h2>
		<p v-if="writing" class="is-size-7 has-text-grey mb-3 i18n-texts-slot">
			What the project can do, the same in every way it runs: the launcher (bare
			"task"), its REPL, "task do", the api, MCP. This host runs on this machine
			with writing allowed: a function that gathers or writes starts here after
			you say yes, one at a time.
		</p>
		<p v-else class="is-size-7 has-text-grey mb-3 i18n-texts-slot">
			What the project can do, the same in every way it runs: the launcher (bare
			"task"), its REPL, "task do", the api, MCP. Functions that gather or write
			files run in a terminal; on this host they are disabled.
		</p>

		<article
			v-if="job"
			class="message is-small"
			:class="{
				'is-info': job.state === 'running',
				'is-success': job.state === 'done',
				'is-danger': job.state === 'failed',
			}"
		>
			<div class="message-header">
				<span translate="no">{{ job.name }} {{ job.args.join(" ") }}</span>
				<span class="i18n-texts-slot">{{ job.state }}</span>
			</div>
			<div class="message-body">
				<pre class="job-lines" translate="no">{{ job.lines.join("\n") }}</pre>
			</div>
		</article>

		<div v-for="part in grouped" :key="part.group" class="mb-4">
			<h3 class="title is-6 has-text-grey i18n-texts-slot">{{ part.title }}</h3>
			<template v-for="one in part.functions" :key="one.name">
				<div
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
						v-else-if="one.allowed && one.writes"
						type="button"
						class="button is-small is-warning is-light mr-2"
						:class="{ 'is-active': chosen === one }"
						translate="no"
						@click="choose(one)"
					>
						{{ one.name }}
					</button>
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
				<form
					v-if="chosen === one"
					class="field has-addons mb-3 ml-2"
					@submit.prevent="start(one)"
				>
					<div class="control is-expanded">
						<input
							v-model="words"
							class="input is-small"
							type="text"
							:placeholder="hint(one)"
							translate="no"
						>
					</div>
					<div class="control">
						<button
							type="submit"
							class="button is-small is-warning"
							:disabled="job?.state === 'running'"
						>
							<span class="i18n-texts-slot">Start</span>
						</button>
					</div>
					<p v-if="failure" class="help is-danger">{{ failure }}</p>
				</form>
			</template>
		</div>
	</section>
</template>

<style scoped>
.function-line .button {
	min-width: 10rem;
	justify-content: flex-start;
}
.job-lines {
	max-height: 16rem;
	overflow: auto;
	white-space: pre-wrap;
	font-size: 0.75rem;
}
</style>
