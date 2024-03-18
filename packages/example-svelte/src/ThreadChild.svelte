<script lang="ts">
	import type { Thread } from "@b.s/qwery-example-api";
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { P } from "$lib/components/ui/typography";
	import { Button } from "$lib/components/ui/button";
	import { StarFilled } from "svelte-radix";
	import type { Readable } from "svelte/store";

	export let uuid: string;
	export let onClickReply: any;
	export let onClickExpand: any;
	export let currentThread: Readable<Thread>;

	const findDeep = (uuid: string, thread?: Thread) => {
		if (!thread) {
			return null;
		}

		if (thread.uuid === uuid) {
			return thread;
		}

		if (!thread.children) {
			return null;
		}

		for (let i = 0; i < thread.children.length; i++) {
			const result = findDeep(uuid, thread.children[i]);

			if (result) {
				return result;
			}
		}
	};

	$: child = findDeep(uuid, $currentThread);
	let rerenders = 0;

	$: if (child) {
		rerenders = rerenders + 1 * 50;
	}

	$: onExpand = onClickExpand(child);
	$: onReply = onClickReply(child);
</script>

<Card
	class="cursor-pointer border-2"
	style={`border-color: hsl(${Math.max(250 - rerenders, 0)}, 100%, 50%)`}>
	<CardHeader>
		<CardTitle>{child.createdBy}</CardTitle>
		<CardDescription class="flex space-x-1">
			<span>{child.createdAt.toDateString()} {rerenders}</span>
			<span>&middot;</span>
			<span class="inline-flex items-center space-x-1">
				<span>{child.likes}</span>
				<span>
					<StarFilled />
				</span>
			</span>
		</CardDescription>
	</CardHeader>
	<CardContent>
		<P>{child.content}</P>
	</CardContent>
	<CardFooter class="flex-col space-y-4">
		{#if child.children}
			<Button class="w-full" variant="secondary" on:click={onExpand}>
				View whole thread
			</Button>
		{/if}
		<Button variant="default" class="w-full" on:click={onReply}>
			Reply
		</Button>
	</CardFooter>
</Card>
