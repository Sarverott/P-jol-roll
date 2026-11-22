<script setup>
// names ranked by their values, as horizontal bars: the types or statuses of acts, the most
// common first; the rest summed in one last line
import { computed } from "vue";
import { ColorPick } from "../../assets/setup.js";

const props = defineProps({
	// { name: value }
	counts: { type: Object, default: () => ({}) },
	top: { type: Number, default: 10 },
});
const ranked = computed(() => {
	const all = Object.entries(props.counts).sort((a, b) => b[1] - a[1]);
	const shown = all.slice(0, props.top);
	const rest = all.slice(props.top).reduce((sum, [, value]) => sum + value, 0);
	return rest ? [...shown, ["…", rest]] : shown;
});
const most = computed(() =>
	Math.max(1, ...ranked.value.map(([, value]) => value)),
);
</script>

<template>
	<table class="table is-narrow is-fullwidth rank-bars" translate="no">
		<tbody>
			<tr v-for="([ name, value ], i) in ranked" :key="name">
				<td class="name">{{ name || "-" }}</td>
				<td class="bar">
					<span
						:style="{
							width: `${(100 * value) / most}%`,
							background: ColorPick.kind(i),
						}"
					></span>
				</td>
				<td class="has-text-right">{{ value.toLocaleString() }}</td>
			</tr>
		</tbody>
	</table>
</template>

<style scoped>
.rank-bars .name {
	width: 40%;
}
.rank-bars .bar span {
	display: block;
	height: 0.9rem;
	border-radius: 2px;
}
</style>
