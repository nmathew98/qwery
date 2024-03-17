<script lang="ts">
	import { type Thread, upsertThread } from "@b.s/qwery-example-api";
	import { type Dispatch, useQwery } from "@b.s/svelte-qwery";
	import { faker } from "@faker-js/faker";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "$lib/components/ui/dialog";
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { P } from "$lib/components/ui/typography";
	import { Input } from "$lib/components/ui/input";
	import ThreadChild from "./ThreadChild.svelte";
	import { StarFilled } from "svelte-radix";

	export let initialValue: Thread;
	export let landingDispatch: Dispatch<Thread[]>;

	const name = faker.person.fullName();

	let content = "";
	let replyTo: Thread | null = null;

	let rerenders = 0;

	const { data, dispatch } = useQwery({
		queryKey: `threads-${initialValue.uuid}`,
		initialValue: initialValue as Thread,
		onChange: async next => {
			const newItem = next.children?.find(thread => !thread.uuid);

			if (!newItem) {
				throw new Error("Unexpected error: New thread not found");
			}

			const result = await upsertThread(newItem);

			return result;
		},
		onSuccess: (next, _previous, result: Omit<Thread, "children">) => ({
			...next,
			children: next.children!.map(child => {
				if (!child.uuid) {
					return {
						...child,
						...result,
					};
				}

				return child;
			}),
		}),
		broadcast: true,
	});

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

	let currentThreadUuid = initialValue.uuid;
	$: currentThread = findDeep(currentThreadUuid, $data) as Thread;
	$: if (currentThread) {
		rerenders = rerenders + 1 * 50;
	}

	const replyToMainThread = () => {
		replyTo = null;
	};

	const onSubmitNewThread = async () => {
		// This is a really deep update so manually create the new `Thread`
		// we are creating a child thread for a child thread
		// and then dispatch the update specifying it has already been persisted
		if (replyTo) {
			const newThread = {
				createdBy: name,
				content: content,
				parent: replyTo.uuid,
				likes: 0,
			};

			const result = await upsertThread(newThread);

			// `dispatch` returns the `latest` version of the main thread here
			// since the global `onChange` which is async is not triggered
			const latest = dispatch(
				thread => {
					const replyingTo = findDeep(
						(replyTo as Thread).uuid,
						thread,
					);

					replyingTo.children ??= [];
					replyingTo.children.unshift(result);
				},
				{ isPersisted: true },
			) as Thread;

			landingDispatch(
				allThreads => {
					const currentThread = allThreads.find(
						thread => thread.uuid === latest.uuid,
					) as Thread;

					currentThread.children = latest.children;
				},
				{ isPersisted: true },
			);

			content = "";

			return;
		}

		const newThread = {
			createdBy: name,
			content: content,
			parent: currentThread.uuid,
			likes: 0,
		};

		// `dispatch` returns a `Promise` here since the global `onChange` is triggered
		await dispatch(thread => {
			thread.children ??= [];

			thread.children.unshift(newThread as Thread);
		});

		content = "";
	};

	const onKeyDown = event => {
		if (event.key === "Enter") {
			return onSubmitNewThread();
		}

		if (event.key === "Backspace") {
			if (content) {
				return;
			}

			return replyToMainThread();
		}
	};

	const makeOnClickReply = child => (event: MouseEvent) => {
		event.stopPropagation();

		replyTo = child;
	};
	const makeOnClickExpandThread = child => () => {
		currentThreadUuid = child.uuid;
	};
	const onClickReturnToMainThread = () => {
		currentThreadUuid = initialValue.uuid;
		replyTo = null;
	};
</script>

{#if data}
	<Dialog>
		<DialogTrigger asChild let:builder>
			<div use:builder.action {...builder}>
				<Card
					class="cursor-pointer max-w-2xl border-2"
					style={`border-color: hsl(${Math.max(250 - rerenders, 0)}, 100%, 50%);`}>
					<CardHeader>
						<CardTitle>{$data?.createdBy} {rerenders}</CardTitle>
						<CardDescription class="flex space-x-1">
							<span>{$data?.createdAt.toDateString()}</span>
							<span>&middot;</span>
							<span class="inline-flex items-center space-x-1">
								<span>{$data?.likes}</span>
								<span>
									<StarFilled />
								</span>
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<P>{$data?.content}</P>
					</CardContent>
					<CardFooter>
						<Button class="w-full">View whole thread</Button>
					</CardFooter>
				</Card>
			</div>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>View whole thread</DialogTitle>
				<DialogDescription>
					{currentThread.content}
				</DialogDescription>
			</DialogHeader>
			{#if currentThread.children}
				<div class="max-h-[50dvh] overflow-scroll flex-col space-y-8">
					{#each currentThread.children as child (child.uuid)}
						<ThreadChild
							{child}
							onClickExpand={makeOnClickExpandThread}
							onClickReply={makeOnClickReply} />
					{/each}
				</div>
			{/if}
			<div class="flex-col space-y-2">
				<Input
					type="text"
					bind:value={content}
					on:keydown={onKeyDown}
					placeholder={replyTo
						? `Reply to ${replyTo.createdBy}`
						: "Share a thought...?"} />
				{#if replyTo}
					<Button
						variant="ghost"
						size="sm"
						on:click={replyToMainThread}>
						Reply to main thread
					</Button>
				{/if}
			</div>
			<DialogFooter>
				{#if currentThread.uuid !== initialValue.uuid}
					<Button
						on:click={onClickReturnToMainThread}
						variant="secondary"
						type="reset">
						View main thread
					</Button>
				{/if}
				<Button
					disabled={!content}
					on:click={onSubmitNewThread}
					type="submit">
					Submit
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
