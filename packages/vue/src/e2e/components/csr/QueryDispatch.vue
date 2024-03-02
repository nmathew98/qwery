<script setup lang="ts">
import { watch } from "vue";
import { useQwery } from "../../../use-qwery";
import { createApi } from "../../api";

const props = defineProps(["onChange", "onSuccess", "onError"]);
const api = createApi();

const test = useQwery({
	initialValue: api.get,
	onChange: props.onChange,
	onSuccess: props.onSuccess,
	onError: props.onError,
});

watch(test.data, next => {
	if (next?.a !== 2) {
		test.dispatch.value(previousValue => {
			previousValue.a = 2;
		});
	}
});
</script>

<template>
	<div>a: {{ test.data.value?.a }}</div>
	<div>b: {{ test.data.value?.b }}</div>
	<div>c: {{ test.data?.value?.c }}</div>
</template>
