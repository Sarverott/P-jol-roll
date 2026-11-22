<!-- the rest of the dataset beside the acts: the work of Sejm, court judgments, the lists of the source -->
<script setup>
import { ref } from "vue";
import CourtJudgments from "../components/data/CourtJudgments.vue";
import SejmWork from "../components/data/SejmWork.vue";
import SourceLists from "../components/data/SourceLists.vue";

const PARTS = [
	{ name: "sejm", title: "work of Sejm" },
	{ name: "judgments", title: "court judgments" },
	{ name: "lists", title: "lists of the source" },
];
const part = ref("sejm");
</script>

<template>
	<section>
		<div class="tabs is-toggle is-small">
			<ul class="i18n-texts-slot">
				<li
					v-for="one in PARTS"
					:key="one.name"
					:class="{ 'is-active': part === one.name }"
				>
					<a :href="`#data`" @click.prevent="part = one.name">{{
						one.title
					}}</a>
				</li>
			</ul>
		</div>
		<SejmWork v-if="part === 'sejm'" />
		<CourtJudgments v-else-if="part === 'judgments'" />
		<SourceLists v-else />
	</section>
</template>
