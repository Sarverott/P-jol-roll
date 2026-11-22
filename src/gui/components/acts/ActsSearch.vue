<script setup>
// what the list shows: a journal and a year with words of titles, or - when the host has
// Typesense - every year at once, by words or by meaning, narrowed by type and status
import { inject } from "vue";

const { state, years, loadActs } = inject("library");
// what Typesense counts among the acts found, to narrow them by
const FACETS = ["type", "status"];
</script>

<template>
	<form @submit.prevent="loadActs()">
		<div class="field">
			<div class="control">
				<div class="select is-fullwidth">
					<select
						v-model="state.journal"
						class="i18n-texts-label"
						aria-label="journal"
						translate="no"
					>
						<option
							v-for="one in state.journals"
							:key="one.code"
							:value="one.code"
						>
							{{ one.code }}{{ one.name ? ` - ${one.name}` : "" }}
						</option>
					</select>
				</div>
			</div>
		</div>
		<div class="field">
			<div class="control">
				<div class="select is-fullwidth">
					<select
						v-model.number="state.year"
						class="i18n-texts-label"
						aria-label="year"
						translate="no"
					>
						<option v-for="one in [...years].reverse()" :key="one" :value="one">
							{{ one }}
						</option>
					</select>
				</div>
			</div>
		</div>
		<div class="field has-addons">
			<div class="control is-expanded">
				<input
					v-model="state.query"
					class="input i18n-texts-placeholder"
					type="search"
					placeholder="words of title"
				>
			</div>
			<div class="control">
				<button class="button is-link i18n-texts-slot" type="submit">
					search
				</button>
			</div>
		</div>
		<div v-if="state.searchable" class="field">
			<label class="checkbox i18n-texts-slot">
				<input v-model="state.everywhere" type="checkbox"> every year, titles,
				keywords and texts
			</label>
		</div>
		<div v-if="state.everywhere && state.meaningful" class="field">
			<label class="checkbox i18n-texts-slot">
				<input v-model="state.byMeaning" type="checkbox"> by meaning, in any
				language
			</label>
		</div>
		<template v-if="state.everywhere">
			<div v-for="name in FACETS" :key="name" class="field">
				<div class="control">
					<div class="select is-small is-fullwidth">
						<select
							v-model="state.filter[name]"
							class="i18n-texts-label"
							:aria-label="name"
						>
							<option value="" class="i18n-texts-slot">every {{ name }}</option>
							<option
								v-for="one in state.facets[name] ?? []"
								:key="one.value"
								:value="one.value"
								translate="no"
							>
								{{ one.value }} ({{ one.count }})
							</option>
						</select>
					</div>
				</div>
			</div>
		</template>
	</form>
</template>
