<script setup>
// NOTE: this frontend should be shared with all viewer webapp interfaces: android app, desktop app, website host
import { marked } from "marked";
import { io } from "socket.io-client";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

// address of the http api (src/openapi): empty means the host that served this page
const props = defineProps({ api: { type: String, default: "" } });
const PAGE = 50;

const journals = ref([]);
const journal = ref("");
const year = ref(0);
const query = ref("");
const page = ref({ total: 0, offset: 0, items: [] });
const chosen = ref(null);
const text = ref("");
const ties = ref([]);
const notice = ref("");
const failure = ref("");

const years = computed(
	() => journals.value.find((one) => one.code === journal.value)?.years ?? [],
);

async function ask(path, as = "json") {
	failure.value = "";
	try {
		const response = await fetch(`${props.api}${path}`);
		if (response.status === 404) return undefined;
		if (!response.ok) throw new Error(`${response.status} ${path}`);
		return as === "json" ? response.json() : response.text();
	} catch (error) {
		failure.value = `the api does not answer: ${error.message}`;
	}
}

async function loadJournals() {
	journals.value = (await ask("/api/journals")) ?? [];
	if (!journal.value && journals.value.length)
		journal.value = journals.value[0].code;
}

async function loadActs(offset = 0) {
	if (!journal.value || !year.value) return;
	const words = encodeURIComponent(query.value);
	page.value = (await ask(
		`/api/acts/${journal.value}/${year.value}?q=${words}&offset=${offset}&limit=${PAGE}`,
	)) ?? { total: 0, offset: 0, items: [] };
}

async function open(act) {
	chosen.value = (await ask(`/api/acts/${act.ELI}`)) ?? { act, files: [] };
	ties.value = (await ask(`/api/acts/${act.ELI}/references`)) ?? [];
	const markdown = await ask(`/api/acts/${act.ELI}/text`, "text");
	// text comes from the source through turndown - raw html is shown as text, never run
	text.value = markdown ? marked.parse(markdown.replace(/</g, "&lt;")) : "";
}

watch(journal, () => {
	year.value = years.value.at(-1) ?? 0;
});
watch(year, () => loadActs());

let socket;
onMounted(async () => {
	await loadJournals();
	socket = io(props.api || undefined, { reconnectionAttempts: 3 });
	socket.on("changed", (paths) => {
		notice.value = `${paths.length} files of the dataset changed - ${new Date().toLocaleTimeString()}`;
		loadJournals();
	});
});
onUnmounted(() => socket?.close());
</script>

<template>
	<main class="viewer">
		<header>
			<h1>P_JOL_ROLL</h1>
			<p>Polish journals of laws, as gathered here. Not legal advice.</p>
			<p v-if="notice" class="notice">{{ notice }}</p>
			<p v-if="failure" class="failure">{{ failure }}</p>
		</header>

		<form class="pick" @submit.prevent="loadActs()">
			<select v-model="journal" aria-label="journal">
				<option v-for="one in journals" :key="one.code" :value="one.code">
					{{ one.code }}{{ one.name ? ` - ${one.name}` : "" }}
				</option>
			</select>
			<select v-model.number="year" aria-label="year">
				<option v-for="one in [...years].reverse()" :key="one" :value="one">{{ one }}</option>
			</select>
			<input v-model="query" type="search" placeholder="words of title" />
			<button type="submit">search</button>
		</form>

		<div class="columns">
			<section class="list">
				<p>{{ page.total }} acts</p>
				<ol>
					<li v-for="act in page.items" :key="act.ELI">
						<a href="#" @click.prevent="open(act)">
							<b>{{ act.ELI }}</b> {{ act.title }}
						</a>
						<small>{{ act.type }} · {{ act.status }}</small>
					</li>
				</ol>
				<nav>
					<button :disabled="page.offset === 0" @click="loadActs(page.offset - PAGE)">previous</button>
					<button :disabled="page.offset + PAGE >= page.total" @click="loadActs(page.offset + PAGE)">next</button>
				</nav>
			</section>

			<article v-if="chosen" class="act">
				<h2>{{ chosen.act.title }}</h2>
				<p>
					{{ chosen.act.displayAddress ?? chosen.act.ELI }} · {{ chosen.act.status }}
					<template v-for="ending in chosen.files.filter((one) => one.endsWith('.pdf'))" :key="ending">
						· <a :href="`${api}/api/acts/${chosen.act.ELI}/file/${ending}`" target="_blank" rel="noopener">{{ ending }}</a>
					</template>
				</p>
				<details v-if="ties.length">
					<summary>{{ ties.length }} ties to other acts</summary>
					<ul>
						<li v-for="tie in ties" :key="`${tie.type}${tie.to}`">
							{{ tie.type }}: <a href="#" @click.prevent="open({ ELI: tie.to })">{{ tie.to }}</a>
						</li>
					</ul>
				</details>
				<div v-if="text" class="text" v-html="text"></div>
				<p v-else>No markdown of this act here: it has no HTML at the source, or "task text" was not run.</p>
			</article>
		</div>
	</main>
</template>

<style scoped>
.viewer { font-family: system-ui, sans-serif; max-width: 80rem; margin: 0 auto; padding: 1rem; }
.pick { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.columns { display: grid; grid-template-columns: minmax(16rem, 1fr) 2fr; gap: 1rem; }
.list ol { padding-left: 1.2rem; }
.list li { margin-bottom: 0.4rem; }
.list small { display: block; opacity: 0.7; }
.text { line-height: 1.5; }
.notice { color: #2a6; }
.failure { color: #c33; }
@media (max-width: 48rem) { .columns { grid-template-columns: 1fr; } }
</style>
