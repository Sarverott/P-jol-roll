import { marked } from "marked";
import { computed, reactive, watch } from "vue";

/*
What the screens of the viewer share: the journals, the page of acts found, the act chosen
with its ties and text, and what the host can do. One library per viewer, made by index.vue
and handed to the screens by provide/inject; every call to the api (src/openapi) goes
through ask(), so a failure lands in one place - the error dialog.
*/

export const PAGE = 50;

const EMPTY = { total: 0, offset: 0, items: [] };

// a snippet of Typesense: only its <mark> stays markup
export const marks = (snippet) =>
	snippet
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/&lt;(\/?)mark>/g, "<$1mark>");

export function createLibrary(api) {
	const state = reactive({
		journals: [],
		journal: "",
		year: 0,
		query: "",
		page: { ...EMPTY },
		chosen: null,
		text: "",
		ties: [],
		diagram: "",
		// the act in Sejm (phase 35): the days its bill was read on, who spoke
		debates: null,
		// what the analysis of the code of law found about it (phase 36)
		findings: [],
		// search of every year by Typesense (/api/search), offered only when the host has it
		searchable: false,
		everywhere: false,
		// ranked by meaning too, when the host has vectors and a model (task embed, Ollama)
		meaningful: false,
		byMeaning: false,
		facets: {},
		filter: { type: "", status: "" },
		notice: "",
		failure: "",
		// the acts counted year by year (/api/statistics), for the plots and the history
		statistics: null,
	});

	const years = computed(
		() => state.journals.find((one) => one.code === state.journal)?.years ?? [],
	);

	async function ask(path, as = "json") {
		try {
			const response = await fetch(`${api}${path}`);
			if (response.status === 404) return undefined;
			if (!response.ok) throw new Error(`${response.status} ${path}`);
			return as === "json" ? response.json() : response.text();
		} catch (error) {
			state.failure = `the api does not answer: ${error.message}`;
		}
	}

	async function loadJournals() {
		state.journals = (await ask("/api/journals")) ?? [];
		if (!state.journal && state.journals.length)
			state.journal = state.journals[0].code;
	}

	async function searchEverywhere(offset = 0) {
		const words = new URLSearchParams({
			q: state.query,
			page: String(Math.floor(offset / PAGE) + 1),
			limit: String(PAGE),
			...(state.filter.type ? { type: state.filter.type } : {}),
			...(state.filter.status ? { status: state.filter.status } : {}),
			...(state.byMeaning ? { meaning: "1" } : {}),
		});
		const found = await ask(`/api/search?${words}`);
		state.facets = found?.facets ?? {};
		state.page = found
			? { total: found.total, offset, items: found.items }
			: { ...EMPTY };
	}

	async function loadActs(offset = 0) {
		if (state.everywhere) return searchEverywhere(offset);
		if (!state.journal || !state.year) return;
		const words = encodeURIComponent(state.query);
		state.page = (await ask(
			`/api/acts/${state.journal}/${state.year}?q=${words}&offset=${offset}&limit=${PAGE}`,
		)) ?? { ...EMPTY };
	}

	async function open(eli) {
		if (state.chosen?.act.ELI === eli) return;
		state.chosen = (await ask(`/api/acts/${eli}`)) ?? {
			act: { ELI: eli, title: eli },
			files: [],
		};
		state.ties = (await ask(`/api/acts/${eli}/references`)) ?? [];
		state.debates = null;
		state.findings = [];
		ask(`/api/acts/${eli}/findings`).then((findings) => {
			if (state.chosen?.act.ELI === eli) state.findings = findings ?? [];
		});
		ask(`/api/acts/${eli}/debates`).then((debates) => {
			if (state.chosen?.act.ELI === eli) state.debates = debates ?? null;
		});
		state.diagram = state.ties.length
			? ((await ask(`/api/acts/${eli}/diagram`, "text")) ?? "")
			: "";
		const markdown = await ask(`/api/acts/${eli}/text`, "text");
		// text comes from the source through turndown - raw html is shown as text, never run
		state.text = markdown ? marked.parse(markdown.replace(/</g, "&lt;")) : "";
	}

	// counted once per viewer; the plots and the history share it
	async function loadStatistics() {
		if (!state.statistics)
			state.statistics = (await ask("/api/statistics")) ?? null;
		return state.statistics;
	}

	// what the host offers besides the acts of a year
	async function probe() {
		const tried = await fetch(`${api}/api/search?q=*&limit=1`).catch(
			() => undefined,
		);
		state.searchable = Boolean(tried?.ok);
		if (!state.searchable) return;
		const asked = await fetch(
			`${api}/api/search?q=law&limit=1&meaning=1`,
		).catch(() => undefined);
		state.meaningful = Boolean(asked?.ok && (await asked.json()).meaning);
	}

	// what follows what: a journal brings its newest year, a year or a way of searching brings
	// its acts, an act in the address is opened
	function follow(route) {
		watch(
			() => state.journal,
			() => {
				state.year = years.value.at(-1) ?? 0;
			},
		);
		watch(
			() => state.year,
			() => loadActs(),
		);
		watch(
			() => [state.everywhere, state.byMeaning],
			() => loadActs(),
		);
		watch(
			() => state.filter,
			() => loadActs(),
			{ deep: true },
		);
		watch(
			() => route.value.eli,
			(eli) => eli && open(eli),
			{ immediate: true },
		);
	}

	return {
		api,
		state,
		years,
		ask,
		loadJournals,
		loadActs,
		loadStatistics,
		open,
		probe,
		follow,
	};
}
