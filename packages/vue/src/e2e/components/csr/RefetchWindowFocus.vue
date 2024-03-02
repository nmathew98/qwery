<script setup lang="ts">
import { vitest } from "vitest";
import { useQwery } from "../../../use-qwery";

const props = defineProps(["getInitialValue"]);

const test = useQwery<{ a: number; b: number; c: number }>({
	initialValue: props.getInitialValue,
	onChange: vitest.fn(),
	refetchOnWindowFocus: true,
	refetch: async ({ dispatch, signal: _signal }) => {
		const result = await props.getInitialValue();

		dispatch(result);
	},
});
</script>

<template>
	<div>a: {{ test.data.value?.a }}</div>
	<div>b: {{ test.data.value?.b }}</div>
	<div>c: {{ test.data.value?.c }}</div>
</template>
