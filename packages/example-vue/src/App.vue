<script setup lang="ts">
import { useMonitoredFetch, useNetworkMode, useQwery } from "@b.s/vue-qwery";
import { useColorMode } from "@vueuse/core";
import { getAllThreads, upsertThread } from "@b.s/qwery-example-api";
import { H1 } from "@/components/ui/typography";
import Thread from "./Thread.vue";
import { computed } from "vue";
import NewThread from "./NewThread.vue";

const mode = useColorMode();
mode.value = "dark";

const { connectionStatus } = useNetworkMode();
const { isFetching, monitor } = useMonitoredFetch();

// We have many main `Thread`s and each `Thread` can have zero or more
// child `Thread`s
const { data, dispatch } = useQwery({
	queryKey: "threads",
	initialValue: monitor(getAllThreads), // Get all main threads
	onChange: async next => {
		const newItemIdx = next.findIndex(thread => !thread.uuid);

		const result = await upsertThread(next[newItemIdx]);

		return result;
	},
	onSuccess: (next, _previous, result) =>
		next.map(thread => {
			if (!thread.uuid) {
				return {
					...thread,
					...result,
				};
			}

			return thread;
		}),
	broadcast: true,
});

const allThreads = computed(() =>
	[...(data.value ?? [])]?.sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	),
);
</script>

<template>
	<div class="flex justify-center my-8 mx-4 sm:mx-0">
		<div class="flex-col space-y-8">
			<H1>My Feed</H1>
			<NewThread :dispatch="dispatch" />

			<Thread
				v-for="thread in allThreads"
				:key="thread.uuid"
				:initialValue="thread"
				:dispatch="dispatch" />
		</div>
	</div>
	<div class="absolute top-6 right-10">
		<div class="flex space-x-4">
			<div
				class="px-4 py-3 rounded-full"
				:class="connectionStatus ? 'bg-emerald-700' : 'bg-rose-700'">
				<span
					class="font-bold"
					:class="
						connectionStatus ? 'text-emerald-400' : 'bg-rose-400'
					">
					{{ connectionStatus ? "Online!" : "Offline!" }}
				</span>
			</div>
			<div
				class="px-4 py-3 rounded-full"
				:class="!isFetching ? 'bg-emerald-700' : 'bg-rose-700'">
				<span
					class="font-bold"
					:class="!isFetching ? 'text-emerald-400' : 'text-rose-400'">
					{{ !isFetching ? "Fetched!" : "Fetching!" }}
				</span>
			</div>
		</div>
	</div>
</template>
