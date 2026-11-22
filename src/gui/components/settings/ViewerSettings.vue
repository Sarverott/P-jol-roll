<script setup>
// the viewer's own settings (assets/settings.js), kept in this browser; the language is the
// header's, the rest is here
import { computed, inject, ref, watch } from "vue";
import { chosen, languages, use } from "../../../i18n/browser.js";
import { applyTheme, reset, settings } from "../../assets/settings.js";

const { api, state } = inject("library");
const here = computed(() => api || globalThis.location?.origin);
const language = ref(chosen());
watch(language, (code) => use(code));
watch(
	() => settings.theme,
	(theme) => applyTheme(theme),
);
</script>

<template>
	<section class="box">
		<h2 class="title is-6 i18n-texts-slot">The viewer</h2>
		<div class="field">
			<label class="label is-small i18n-texts-slot" for="setting-theme"
				>look</label
			>
			<div class="select is-small i18n-texts-slot">
				<select id="setting-theme" v-model="settings.theme">
					<option value="auto">as the system</option>
					<option value="light">light</option>
					<option value="dark">dark</option>
				</select>
			</div>
		</div>
		<div v-if="languages.length > 1" class="field">
			<label class="label is-small i18n-texts-slot" for="setting-language"
				>language</label
			>
			<div class="select is-small" translate="no">
				<select id="setting-language" v-model="language">
					<option v-for="one in languages" :key="one.code" :value="one.code">
						{{ one.name }}
					</option>
				</select>
			</div>
		</div>
		<div class="field">
			<label class="label is-small i18n-texts-slot" for="setting-speed"
				>years per second of the history</label
			>
			<div class="select is-small">
				<select id="setting-speed" v-model.number="settings.speed">
					<option v-for="one in [0.5, 1, 2, 5, 10]" :key="one" :value="one">
						{{ one }}
					</option>
				</select>
			</div>
		</div>
		<div class="field">
			<label class="checkbox i18n-texts-slot">
				<input v-model="settings.minimap" type="checkbox">
				the minimap of ties beside the acts
			</label>
		</div>
		<div class="field">
			<label class="checkbox i18n-texts-slot">
				<input v-model="settings.webmcp" type="checkbox">
				offer the reading to an AI agent in this browser (WebMCP) - after a
				reload
			</label>
		</div>
		<button
			type="button"
			class="button is-small i18n-texts-slot"
			@click="reset"
		>
			back to the defaults
		</button>

		<h2 class="title is-6 mt-5 i18n-texts-slot">This host</h2>
		<table class="table is-narrow">
			<tbody>
				<tr>
					<td class="i18n-texts-slot">the api</td>
					<td translate="no">{{ here }}</td>
				</tr>
				<tr>
					<td class="i18n-texts-slot">search of every year</td>
					<td class="i18n-texts-slot">{{ state.searchable ? "yes" : "no" }}</td>
				</tr>
				<tr>
					<td class="i18n-texts-slot">search by meaning</td>
					<td class="i18n-texts-slot">{{ state.meaningful ? "yes" : "no" }}</td>
				</tr>
				<tr>
					<td class="i18n-texts-slot">description for programs</td>
					<td>
						<a :href="`${api}/openapi.json`" target="_blank" rel="noopener"
							>/openapi.json</a
						>
						·
						<a :href="`${api}/mcp`" target="_blank" rel="noopener">/mcp</a>
					</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>
