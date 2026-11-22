<script setup>
// the brand of the project and the language of the viewer: its pack laid over the page
// (src/i18n), data left as it is
import { ref, watch } from "vue";
import { chosen, languages, use } from "../../i18n/browser.js";

const language = ref(chosen());
watch(language, (code) => use(code));
</script>

<template>
	<header class="hero is-small brand">
		<div class="hero-body">
			<div class="media is-align-items-center">
				<figure class="media-left image is-64x64">
					<img
						class="is-rounded"
						src="favicon-48.png"
						alt=""
						width="64"
						height="64"
					>
				</figure>
				<div class="media-content">
					<h1 class="title" translate="no">P_JOL_ROLL</h1>
					<p class="subtitle is-6 i18n-texts-slot">
						Polish journals of laws, as gathered here. Not legal advice.
					</p>
				</div>
				<div v-if="languages.length > 1" class="media-right">
					<div class="select is-small" translate="no">
						<select
							v-model="language"
							class="i18n-texts-label"
							aria-label="language"
						>
							<option
								v-for="one in languages"
								:key="one.code"
								:value="one.code"
							>
								{{ one.name }}
							</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	</header>
</template>

<style scoped>
.brand {
	background: var(--p-brand);
}
.brand .title,
.brand .subtitle {
	color: var(--p-brand-text);
}
</style>
