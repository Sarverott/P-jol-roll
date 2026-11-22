<!-- the viewer's settings, what this host offers, and every function of the project -->
<script setup>
import FunctionsList from "../components/settings/FunctionsList.vue";
import ViewerSettings from "../components/settings/ViewerSettings.vue";
</script>

<template>
	<div class="columns">
		<div class="column is-5">
			<ViewerSettings />
		</div>
		<div class="column">
			<FunctionsList />
		</div>
	</div>
</template>
