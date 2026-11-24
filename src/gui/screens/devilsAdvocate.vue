<!-- the law mastermind as a chat (phase 32; reserved since Q18): a question answered from the
     acts read through the MCP tools, each cited act a link. A host on this machine answers with
     its own model (MASTERMIND_URL); the demo space on the visitor's own Hugging Face account,
     once signed in; anywhere else it says how to have one. -->
<script setup>
import { inject, onBeforeUnmount, onMounted, ref } from "vue";
import AnswerCard from "../components/ask/AnswerCard.vue";

const api = inject("api", "");
const about = ref(null); // { answers, signIn, model, hard }
const me = ref(null); // { signingIn, user }
const question = ref("");
// the advanced strategy (phase 34): a weak answer goes on to the deepseek of hard questions
const escalate = ref(false);
const talk = ref([]); // { question, advice?, error?, login?, waiting? }
const seconds = ref(0);
let clock;

onMounted(async () => {
	const json = (path) =>
		fetch(`${api}${path}`)
			.then((answer) => (answer.ok ? answer.json() : null))
			.catch(() => null);
	[about.value, me.value] = await Promise.all([
		json("/api/ask/about"),
		json("/api/me"),
	]);
});
onBeforeUnmount(() => clearInterval(clock));

const busy = () => talk.value.some((one) => one.waiting);

async function send() {
	const asked = question.value.trim();
	if (!asked || busy()) return;
	question.value = "";
	const one = ref({ question: asked, waiting: true }).value;
	talk.value.push(one);
	seconds.value = 0;
	clock = setInterval(() => seconds.value++, 1000);
	try {
		const answer = await fetch(
			`${api}/api/ask?question=${encodeURIComponent(asked)}${escalate.value ? "&escalate=1" : ""}`,
		);
		const body = await answer.json().catch(() => ({}));
		if (answer.ok) one.advice = body;
		else {
			one.error = body.error ?? `the host answered ${answer.status}`;
			one.login = body.login;
		}
	} catch (error) {
		one.error = `no answer: ${error.message}`;
	} finally {
		one.waiting = false;
		clearInterval(clock);
	}
}
</script>

<template>
	<section>
		<p v-if="!about" class="notification i18n-texts-slot">
			No host here answers questions: the mastermind runs where its api has a
			model - <code>task mastermind:ask</code>, or
			<code>docker compose --profile mastermind up -d</code>.
		</p>
		<template v-else>
			<p class="mb-3 i18n-texts-slot">
				Ask about the law of Poland. The answer comes from the acts the model
				reads through the project's tools, each cited act a link.
				<strong>Not (formally) legal advices.</strong>
				<span v-if="about.model" class="is-size-7 has-text-grey">
					(<span translate="no">{{ about.model }}</span>)</span
				>
			</p>
			<p
				v-if="!about.answers"
				class="notification is-warning is-light i18n-texts-slot"
			>
				This host has no model to ask.
			</p>
			<div
				v-else-if="about.signIn && !me?.user"
				class="notification is-info is-light i18n-texts-slot"
			>
				The answers here run on your own Hugging Face account (its Inference
				Providers credits).
				<a
					class="button is-small is-dark ml-2"
					:href="`${api}/login?back=/%23ask`"
					target="_top"
					>Sign in with Hugging Face</a
				>
			</div>
			<p v-else-if="me?.user" class="is-size-7 mb-3 i18n-texts-slot">
				Signed in as <strong translate="no">{{ me.user.name }}</strong> ·
				<a :href="`${api}/logout?back=/%23ask`" target="_top">sign out</a>
			</p>

			<div v-for="(one, i) in talk" :key="i" class="mb-4">
				<p class="has-text-weight-semibold mb-2">{{ one.question }}</p>
				<p v-if="one.waiting" class="has-text-grey i18n-texts-slot">
					reading the acts and thinking… {{ seconds }} s
				</p>
				<AnswerCard v-else-if="one.advice" :advice="one.advice" />
				<p v-else class="notification is-danger is-light">
					{{ one.error }}
					<a
						v-if="one.login"
						class="i18n-texts-slot"
						:href="`${api}${one.login}`"
						target="_top"
						>Sign in with Hugging Face</a
					>
				</p>
			</div>

			<form class="field has-addons" @submit.prevent="send">
				<div class="control is-expanded">
					<input
						v-model="question"
						class="input"
						maxlength="2000"
						placeholder="e.g. Czym była Rada Stanu Królestwa Polskiego?"
						:disabled="!about.answers"
					>
				</div>
				<div class="control">
					<button
						type="submit"
						class="button is-primary i18n-texts-slot"
						:class="{ 'is-loading': busy() }"
						:disabled="!about.answers || busy()"
					>
						ask
					</button>
				</div>
			</form>
			<label v-if="about.hard" class="checkbox is-size-7 i18n-texts-slot">
				<input v-model="escalate" type="checkbox" :disabled="busy()">
				a hard question: a weak answer goes on to
				<span translate="no">{{ about.hard }}</span> (slower, paid by the same
				account)
			</label>
		</template>
	</section>
</template>
