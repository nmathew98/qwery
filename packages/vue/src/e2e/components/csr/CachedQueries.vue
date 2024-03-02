<script setup lang="ts">
import { vitest } from "vitest";
import { useQwery } from "../../../use-qwery";

const props = defineProps(["queryKey"]);

const test = useQwery<{ a: number; b: number; c: number }>({
	queryKey: props.queryKey,
	onChange: vitest.fn(),
});
</script>

<template>
	<div>a: {{ test.data.value?.a }}</div>
	<div>b: {{ test.data.value?.b }}</div>
	<div>c: {{ test.data.value?.c }}</div>
</template>
