<script setup lang="ts">
import { ref } from "vue";
import {
	Card,
	CardHeader,
	CardContent,
	CardTitle,
	CardFooter,
} from "./components/ui/card";
import { faker } from "@faker-js/faker";
import { Textarea } from "./components/ui/textarea";
import { Button } from "./components/ui/button";
import { Dispatch } from "@b.s/vue-qwery";
import { Thread } from "@b.s/qwery-example-api";

const props = defineProps<{
	dispatch: Dispatch<Thread[]>;
}>();

const name = faker.person.fullName();
const content = ref("");

const onSubmitNewThread = () => {
	const newThread = {
		createdBy: name,
		content: content.value,
		likes: 0,
	} as Thread;

	// Dispatch and create a new `Thread`
	props.dispatch(allThreads => void allThreads.unshift(newThread));

	content.value = "";
};

const onKeyDownEnter = event => {
	event.preventDefault();
	return onSubmitNewThread();
};
</script>

<template>
	<Card className="w-[42rem] border-2">
		<CardHeader>
			<CardTitle>{{ name }}</CardTitle>
		</CardHeader>
		<CardContent>
			<Textarea
				v-model.trim="content"
				@keydown.enter="onKeyDownEnter"
				placeholder="Share a thought...?" />
		</CardContent>
		<CardFooter>
			<Button
				@click="onSubmitNewThread"
				:disabled="!content"
				class="w-full">
				Submit
			</Button>
		</CardFooter>
	</Card>
</template>
