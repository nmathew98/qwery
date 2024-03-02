<script setup lang="ts">
import { vitest } from "vitest";
import { useQwery } from "../../../use-qwery";
import { createApi } from "../../api";

const api = createApi();

const test = useQwery({
	initialValue: api.get,
	onChange: vitest.fn(),
	subscribe: api.subscribe,
});
</script>

<template>
	<div>a: {{ test.data.value?.a }}</div>
	<div>b: {{ test.data.value?.b }}</div>
	<div>c: {{ test.data.value?.c }}</div>
</template>
