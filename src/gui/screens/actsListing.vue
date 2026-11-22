<!-- standard listing and indexing of entries (now named as "acts tab") with full pagination and other sorts of things. NOTICE THAT VIEWER SHOULD BE AS SEPARED SCREEN BUT MINIMAP GRAPH SHOULD BE ON BOTH VIEW OF CONTENT AND LISTER SCREEN -->
<!-- ANSWER: done - the search on the left, the list with first/previous/page of/next/last; an act opens on its own screen (contentDisplay.vue), and the minimap of the act chosen last stays on both (index.vue) -->
<script setup>
import { inject } from "vue";
import ActsList from "../components/acts/ActsList.vue";
import ActsPager from "../components/acts/ActsPager.vue";
import ActsSearch from "../components/acts/ActsSearch.vue";
import AsideLeft from "../layout/aside-left.vue";

const { state } = inject("library");
</script>

<template>
	<div class="columns">
		<AsideLeft>
			<ActsSearch />
		</AsideLeft>
		<section class="column">
			<p class="has-text-grey mb-2 i18n-texts-slot">
				{{ state.page.total }} acts
			</p>
			<ActsList />
			<ActsPager />
		</section>
	</div>
</template>
