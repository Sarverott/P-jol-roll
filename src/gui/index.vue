<script setup>
// NOTE: this frontend should be shared with all viewer webapp interfaces: android app, desktop app, website host
// Bulma: the layout and the look of every interface that shows the viewer, light and dark
import "bulma/css/bulma.min.css";
import { marked } from "marked";
import { io } from "socket.io-client";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import LawMap from "./components/LawMap.vue";
import TiesDiagram from "./components/TiesDiagram.vue";
import TiesMinimap from "./components/TiesMinimap.vue";

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
const diagram = ref("");
// what is shown: the acts of a year, or the map of the whole law
const view = ref("acts");
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
	view.value = "acts";
	chosen.value = (await ask(`/api/acts/${act.ELI}`)) ?? { act, files: [] };
	ties.value = (await ask(`/api/acts/${act.ELI}/references`)) ?? [];
	diagram.value = ties.value.length
		? ((await ask(`/api/acts/${act.ELI}/diagram`, "text")) ?? "")
		: "";
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
		<section class="hero is-small brand">
			<div class="hero-body">
				<div class="media is-align-items-center">
					<figure class="media-left image is-64x64">
						<img class="is-rounded" src="favicon-48.png" alt="" width="64" height="64" />
					</figure>
					<div class="media-content">
						<h1 class="title">P_JOL_ROLL</h1>
						<p class="subtitle is-6">Polish journals of laws, as gathered here. Not legal advice.</p>
					</div>
				</div>
			</div>
		</section>

		<div class="section pt-4">
			<div v-if="notice" class="notification is-success is-light py-2">{{ notice }}</div>
			<div v-if="failure" class="notification is-danger is-light py-2">{{ failure }}</div>

			<div class="tabs">
				<ul>
					<li :class="{ 'is-active': view === 'acts' }"><a href="#" @click.prevent="view = 'acts'">acts</a></li>
					<li :class="{ 'is-active': view === 'map' }"><a href="#" @click.prevent="view = 'map'">map of the whole law</a></li>
				</ul>
			</div>

			<LawMap v-if="view === 'map'" :api="api" @open="open" />

			<form v-show="view === 'acts'" class="field is-grouped is-grouped-multiline" @submit.prevent="loadActs()">
				<div class="control">
					<div class="select">
						<select v-model="journal" aria-label="journal">
							<option v-for="one in journals" :key="one.code" :value="one.code">
								{{ one.code }}{{ one.name ? ` - ${one.name}` : "" }}
							</option>
						</select>
					</div>
				</div>
				<div class="control">
					<div class="select">
						<select v-model.number="year" aria-label="year">
							<option v-for="one in [...years].reverse()" :key="one" :value="one">{{ one }}</option>
						</select>
					</div>
				</div>
				<div class="control is-expanded">
					<input v-model="query" class="input" type="search" placeholder="words of title" />
				</div>
				<div class="control">
					<button class="button is-link" type="submit">search</button>
				</div>
			</form>

			<div v-show="view === 'acts'" class="columns">
				<section class="column is-two-fifths-desktop list">
					<p class="has-text-grey mb-2">{{ page.total }} acts</p>
					<div class="list-items">
						<a
							v-for="act in page.items"
							:key="act.ELI"
							href="#"
							class="box p-3 mb-2 is-block"
							:class="{ 'is-chosen': chosen?.act.ELI === act.ELI }"
							@click.prevent="open(act)"
						>
							<strong>{{ act.ELI }}</strong> {{ act.title }}
							<span class="tags mt-1">
								<span class="tag">{{ act.type }}</span>
								<span class="tag" :class="act.status === 'obowiązujący' ? 'is-success is-light' : 'is-light'">{{ act.status }}</span>
							</span>
						</a>
					</div>
					<nav class="buttons mt-3">
						<button class="button is-small" :disabled="page.offset === 0" @click="loadActs(page.offset - PAGE)">previous</button>
						<button class="button is-small" :disabled="page.offset + PAGE >= page.total" @click="loadActs(page.offset + PAGE)">next</button>
					</nav>
				</section>

				<article v-if="chosen" class="column act">
					<h2 class="title is-4">{{ chosen.act.title }}</h2>
					<div class="tags">
						<span class="tag is-dark">{{ chosen.act.displayAddress ?? chosen.act.ELI }}</span>
						<span class="tag" :class="chosen.act.status === 'obowiązujący' ? 'is-success is-light' : 'is-light'">{{ chosen.act.status }}</span>
						<a
							v-for="ending in chosen.files.filter((one) => one.endsWith('.pdf'))"
							:key="ending"
							class="tag is-link is-light"
							:href="`${api}/api/acts/${chosen.act.ELI}/file/${ending}`"
							target="_blank"
							rel="noopener"
						>{{ ending }}</a>
					</div>
					<details v-if="ties.length" class="mb-4" open>
						<summary>{{ ties.length }} {{ ties.length === 1 ? "tie" : "ties" }} to other acts</summary>
						<TiesDiagram :source="diagram" @open="open" />
					</details>
					<details v-if="ties.length" class="mb-4">
						<summary>the ties as a list</summary>
						<ul class="mt-2">
							<li v-for="tie in ties" :key="`${tie.type}${tie.to}`">
								{{ tie.type }}: <a href="#" @click.prevent="open({ ELI: tie.to })">{{ tie.to }}</a>
							</li>
						</ul>
					</details>
					<div v-if="text && chosen.text?.from === 'pdf'" class="notification is-warning is-light py-2 origin">
						Text read from the PDF<template v-if="/Paper Capture/.test(chosen.text.producer ?? '')">, recognised from a scan of the printed journal</template>:
						it is not corrected and may hold mistakes - the <a :href="chosen.text.url" target="_blank" rel="noopener">PDF at the source</a> is the text.
					</div>
					<div v-if="text" class="content" v-html="text"></div>
					<p v-else class="has-text-grey">No markdown of this act here: "task text" was not run for it, or its PDF is a scan without text.</p>
				</article>
				<div v-else class="column has-text-grey">Choose an act on the left.</div>
			</div>
			<TiesMinimap v-if="view === 'acts'" :eli="chosen?.act.ELI ?? ''" :ties="ties" @open="open" />
		</div>
	</main>
</template>

<style scoped>
.brand { background: #1d2440; }
.brand .title, .brand .subtitle { color: #f3efe4; }
.list-items { max-height: 75vh; overflow-y: auto; }
.list-items .box { color: inherit; }
.list-items .is-chosen { outline: 2px solid var(--bulma-link); }
.origin { font-size: 0.9rem; }
.act { min-width: 0; overflow-wrap: anywhere; }
</style>
