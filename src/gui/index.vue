<script setup>
// NOTE: this frontend should be shared with all viewer webapp interfaces: android app, desktop app, website host
// The viewer: a header, the tabs of the screens (the acts, one act, the map of the whole law,
// the rest of the dataset, plots, statistics with the history, settings) and a footer; what
// the screens share is the library (assets/library.js), where the viewer is is the address
// after "#" (assets/route.js).
// Bulma: the layout and the look of every interface that shows the viewer, light and dark
//
// NOTE: this file is way too long and too dense - diverse it into imported components
// ANSWER: done - layout/ (header, main, footer, the asides, the error dialog), screens/ (acts,
// an act, the map), components/ (acts/, act/, map/, ties/, the tabs); this file only puts them
// together
import "bulma/css/bulma.min.css";
import {
	defineAsyncComponent,
	onMounted,
	onUnmounted,
	provide,
	ref,
} from "vue";
import { chosen, use } from "../i18n/browser.js";
import { createLibrary } from "./assets/library.js";
import { href, useRoute } from "./assets/route.js";
import { applyTheme, settings } from "./assets/settings.js";
import { ColorPick } from "./assets/setup.js";
import { listen } from "./assets/socket.js";
import LayoutFooter from "./layout/footer.vue";
import LayoutHeader from "./layout/header.vue";
import LayoutMain from "./layout/main.vue";
import ErrorDialog from "./layout/modals/errordialog.vue";
import ActsListing from "./screens/actsListing.vue";
import ContentDisplay from "./screens/contentDisplay.vue";
import DatasetBrowser from "./screens/datasetBrowser.vue";
import GeneralMap from "./screens/generalMap.vue";
import SettingsPanel from "./screens/settingsPanel.vue";

// Cytoscape.js comes with the minimap, so it is loaded when there are ties to draw; the plots
// and the history only when their screens are shown
const TiesMinimap = defineAsyncComponent(
	() => import("./components/ties/TiesMinimap.vue"),
);
const PlotsDiagrams = defineAsyncComponent(
	() => import("./screens/plotsDiagrams.vue"),
);
const StatisticsHistory = defineAsyncComponent(
	() => import("./screens/statisticsHistory.vue"),
);

// address of the http api (src/openapi): empty means the host that served this page
const props = defineProps({ api: { type: String, default: "" } });

const library = createLibrary(props.api);
const { state } = library;
const { route, stop } = useRoute();
const root = ref(null);

function openAct({ ELI }) {
	location.hash = href("act", ELI);
}

provide("library", library);
provide("openAct", openAct);
library.follow(route);

let unlisten;
onMounted(async () => {
	ColorPick.paint(root.value);
	applyTheme();
	await use(chosen());
	await library.loadJournals();
	await library.probe();
	unlisten = listen(props.api, {
		changed(paths) {
			state.notice = `${paths.length} files of the dataset changed - ${new Date().toLocaleTimeString()}`;
			library.loadJournals();
		},
	});
});
onUnmounted(() => {
	unlisten?.();
	stop();
});
</script>

<template>
	<main ref="root" class="viewer">
		<LayoutHeader />
		<LayoutMain
			:screen="route.screen"
			:chosen="state.chosen?.act.ELI ?? ''"
			:notice="state.notice"
		>
			<ActsListing v-show="route.screen === 'acts'" />
			<ContentDisplay v-if="route.screen === 'act'" />
			<GeneralMap v-if="route.screen === 'map'" />
			<DatasetBrowser v-if="route.screen === 'data'" />
			<PlotsDiagrams v-if="route.screen === 'plots'" />
			<StatisticsHistory v-if="route.screen === 'statistics'" />
			<SettingsPanel v-if="route.screen === 'settings'" />
		</LayoutMain>
		<TiesMinimap
			v-if="settings.minimap && ['acts', 'act'].includes(route.screen)"
			:eli="state.chosen?.act.ELI ?? ''"
			:ties="state.ties"
			@open="openAct"
		/>
		<LayoutFooter />
		<ErrorDialog v-model="state.failure" />
	</main>
</template>
