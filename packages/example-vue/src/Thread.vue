<script setup lang="ts">
import { Thread, upsertThread } from "@b.s/qwery-example-api";
import { Dispatch, useQwery } from "@b.s/vue-qwery";
import { faker } from "@faker-js/faker";
import { computed, ref, watch } from "vue";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { P } from "./components/ui/typography";
import { Input } from "./components/ui/input";
import ThreadChild from "./ThreadChild.vue";
import { Icon } from "@iconify/vue";

const props = defineProps<{
	initialValue: Thread;
	dispatch: Dispatch<Thread[]>;
}>();

const name = faker.person.fullName();

const content = ref("");
const replyTo = ref<any>(null);

const rerenders = ref(0);

const { data, dispatch } = useQwery({
	queryKey: `threads-${props.initialValue.uuid}`,
	initialValue: props.initialValue as Thread,
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

const currentThreadUuid = ref(props.initialValue.uuid);
const currentThread = computed(() =>
	findDeep(currentThreadUuid.value, data.value as Thread),
);

watch(currentThread, () => {
	rerenders.value = rerenders.value + 1 * 50;
});

const replyToMainThread = () => {
	replyTo.value = null;
};

const onSubmitNewThread = async () => {
	// This is a really deep update so manually create the new `Thread`
	// we are creating a child thread for a child thread
	// and then dispatch the update specifying it has already been persisted
	if (replyTo.value) {
		const newThread = {
			createdBy: name,
			content: content.value,
			parent: replyTo.value.uuid,
			likes: 0,
		};

		const result = await upsertThread(newThread);

		// `dispatch` returns the `latest` version of the main thread here
		// since the global `onChange` which is async is not triggered
		const latest = dispatch(
			thread => {
				const replyingTo = findDeep(replyTo.value.uuid, thread);

				replyingTo.children ??= [];
				replyingTo.children.unshift(result);
			},
			{ isPersisted: true },
		) as Thread;

		props.dispatch(
			allThreads => {
				const currentThread = allThreads.find(
					thread => thread.uuid === latest.uuid,
				) as Thread;

				currentThread.children = latest.children;
			},
			{ isPersisted: true },
		);

		content.value = "";

		return;
	}

	const newThread = {
		createdBy: name,
		content: content.value,
		parent: currentThread.value.uuid,
		likes: 0,
	};

	// `dispatch` returns a `Promise` here since the global `onChange` is triggered
	await dispatch(thread => {
		thread.children ??= [];

		thread.children.unshift(newThread as Thread);
	});

	content.value = "";
};

const onPressEnter = () => {
	return onSubmitNewThread();
};

const onPressBackspace = () => {
	if (content.value) {
		return;
	}

	replyToMainThread();
};

const makeOnClickReply = child => (event: MouseEvent) => {
	event.stopPropagation();

	replyTo.value = child;
};
const makeOnClickExpandThread = child => () => {
	currentThreadUuid.value = child.uuid;
};
const onClickReturnToMainThread = () => {
	currentThreadUuid.value = props.initialValue.uuid;
	replyTo.value = null;
};
</script>

<template>
	<Dialog v-if="data">
		<DialogTrigger as-child>
			<Card
				class="cursor-pointer max-w-2xl border-2"
				:style="{
					borderColor: `hsl(${Math.max(250 - rerenders, 0)}, 100%, 50%)`,
				}">
				<CardHeader>
					<CardTitle>{{ data.createdBy }}</CardTitle>
					<CardDescription class="flex space-x-1">
						<span>{{ data.createdAt.toDateString() }}</span>
						<span>&middot;</span>
						<span class="inline-flex items-center space-x-1">
							<span>{{ data.likes }}</span>
							<span>
								<Icon icon="radix-icons:star-filled" />
							</span>
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<P>{{ data.content }}</P>
				</CardContent>
				<CardFooter>
					<Button class="w-full">View whole thread</Button>
				</CardFooter>
			</Card>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>View whole thread</DialogTitle>
				<DialogDescription>
					{{ currentThread.content }}
				</DialogDescription>
			</DialogHeader>
			<div
				v-if="currentThread.children"
				class="max-h-[50dvh] overflow-scroll flex-col space-y-8">
				<ThreadChild
					v-for="child in currentThread.children"
					:key="child.uuid"
					:child="child"
					:onClickExpand="makeOnClickExpandThread"
					:onClickReply="makeOnClickReply" />
			</div>
			<div class="flex-col space-y-2">
				<Input
					type="text"
					v-model.trim="content"
					@keydown.enter="onPressEnter"
					@keydown.backspace="onPressBackspace"
					:placeholder="
						replyTo
							? `Reply to ${replyTo.createdBy}`
							: 'Share a thought...?'
					" />
				<Button
					v-if="replyTo"
					variant="ghost"
					size="sm"
					@click="replyToMainThread">
					Reply to main thread
				</Button>
			</div>
			<DialogFooter>
				<Button
					v-if="currentThread.uuid !== initialValue.uuid"
					@click="onClickReturnToMainThread"
					variant="secondary"
					type="reset">
					View main thread
				</Button>
				<Button
					:disabled="!content"
					:onClick="onSubmitNewThread"
					type="submit">
					Submit
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
