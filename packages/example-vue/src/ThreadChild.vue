<script setup lang="ts">
import { Thread } from "@b.s/qwery-example-api";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./components/ui/card";
import { ref, watch } from "vue";
import { P } from "./components/ui/typography";
import { Button } from "./components/ui/button";
import { Icon } from "@iconify/vue";

const props = defineProps<{
	child: Thread;
	onClickReply: any;
	onClickExpand: any;
}>();

const rerenders = ref(0);

watch(
	() => props.child,
	() => {
		rerenders.value = rerenders.value + 1 * 50;
	},
);

const onClickExpand = props.onClickExpand(props.child);
const onClickReply = props.onClickReply(props.child);
</script>

<template>
	<Card
		class="cursor-pointer border-2"
		:style="{
			borderColor: `hsl(${Math.max(250 - rerenders, 0)}, 100%, 50%)`,
		}">
		<CardHeader>
			<CardTitle>{{ child.createdBy }}</CardTitle>
			<CardDescription class="flex space-x-1">
				<span
					>{{ child.createdAt.toDateString() }} {{ rerenders }}</span
				>
				<span>&middot;</span>
				<span class="inline-flex items-center space-x-1">
					<span>{{ child.likes }}</span>
					<span>
						<Icon icon="radix-icons:star-filled" />
					</span>
				</span>
			</CardDescription>
		</CardHeader>
		<CardContent>
			<P>{{ child.content }}</P>
		</CardContent>
		<CardFooter class="flex-col space-y-4">
			<Button
				v-if="child.children"
				class="w-full"
				variant="secondary"
				@click="onClickExpand">
				View whole thread
			</Button>
			<Button variant="default" class="w-full" @click="onClickReply">
				Reply
			</Button>
		</CardFooter>
	</Card>
</template>
