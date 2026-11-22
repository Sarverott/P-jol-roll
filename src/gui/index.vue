<script setup>
// NOTE: this frontend should be shared with all viewer webapp interfaces: android app, desktop app, website host
// The viewer: a header, the tabs of the screens (the acts, one act, the map of the whole law)
// and a footer; what the screens share is the library (assets/library.js), where the viewer is
// is the address after "#" (assets/route.js).
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
import { ColorPick } from "./assets/setup.js";
import { listen } from "./assets/socket.js";
import LayoutFooter from "./layout/footer.vue";
import LayoutHeader from "./layout/header.vue";
import LayoutMain from "./layout/main.vue";
import ErrorDialog from "./layout/modals/errordialog.vue";
import ActsListing from "./screens/actsListing.vue";
import ContentDisplay from "./screens/contentDisplay.vue";
import GeneralMap from "./screens/generalMap.vue";

// Cytoscape.js comes with the minimap, so it is loaded when there are ties to draw
const TiesMinimap = defineAsyncComponent(
	() => import("./components/ties/TiesMinimap.vue"),
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
		</LayoutMain>
		<TiesMinimap
			v-if="route.screen !== 'map'"
			:eli="state.chosen?.act.ELI ?? ''"
			:ties="state.ties"
			@open="openAct"
		/>
		<LayoutFooter />
		<ErrorDialog v-model="state.failure" />
	</main>
</template>
