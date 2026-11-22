<script setup>
// Terms of use: the licence, what the acts are and are not, the members of the project
// (.github/AUTHORS) and the links where the project lives - opened from the footer; the
// website reads both at build and hands them to the viewer (src/web/data/credits.ts)
import { inject, onMounted, onUnmounted } from "vue";

const { authors, links } = inject("credits", { authors: [], links: [] });

const open = defineModel({ type: Boolean, default: false });
const close = () => {
	open.value = false;
};
const onEscape = (event) => event.key === "Escape" && close();
onMounted(() => addEventListener("keydown", onEscape));
onUnmounted(() => removeEventListener("keydown", onEscape));
</script>

<template>
	<div class="modal" :class="{ 'is-active': open }">
		<!-- biome-ignore lint/a11y/noStaticElementInteractions: a click beside the dialog closes it; the keyboard has Escape and the button -->
		<!-- biome-ignore lint/a11y/useKeyWithClickEvents: as above -->
		<div class="modal-background" @click="close"></div>
		<div class="modal-card" role="dialog" aria-labelledby="terms-title">
			<header class="modal-card-head">
				<p id="terms-title" class="modal-card-title i18n-texts-slot">
					Terms of use
				</p>
				<button
					type="button"
					class="delete i18n-texts-label"
					aria-label="close"
					@click="close"
				></button>
			</header>
			<section class="modal-card-body content">
				<h2 class="title is-6 i18n-texts-slot">Licence</h2>
				<p class="i18n-texts-slot">
					P_JOL_ROLL is free software under the GNU Affero General Public
					License, version 3 only (AGPL-3.0-only): you may run, study, share and
					change it, and a changed copy served to others must offer its code
					too.
				</p>
				<p class="i18n-texts-slot">
					The acts are normative acts and official documents, which Polish
					copyright law does not cover (article 4 of the act on copyright and
					related rights). Not (formally) legal advices: the journal published
					by the state is the law.
				</p>
				<h2 class="title is-6 i18n-texts-slot">Authors</h2>
				<ul translate="no">
					<li v-for="one in authors" :key="one.name">
						<a v-if="one.url" :href="one.url" target="_blank" rel="noopener">{{
							one.name
						}}</a>
						<span v-else>{{ one.name }}</span>
						<span v-if="one.lineage" class="has-text-grey">
							- {{ one.lineage }}</span
						>
					</li>
				</ul>
				<h2 class="title is-6 i18n-texts-slot">Links</h2>
				<ul>
					<li v-for="link in links" :key="link.href">
						<a
							:href="link.href"
							target="_blank"
							rel="noopener"
							translate="no"
							>{{
								link.name
							}}</a
						>
						<span class="has-text-grey i18n-texts-slot">
							- {{ link.what }}</span
						>
					</li>
				</ul>
			</section>
		</div>
	</div>
</template>
