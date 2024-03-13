import { computed, ref } from "vue";
import { makeMonitor } from "@b.s/qwery-shared";

export const useMonitoredFetch = () => {
	const allFetchStatus = ref<{ [key: string]: boolean }>(Object.create(null));

	const update = f => {
		const next = f(allFetchStatus.value);

		allFetchStatus.value = next;
	};
	const monitor = makeMonitor(update);

	return {
		isFetching: computed(() =>
			Object.values(allFetchStatus.value).every(Boolean),
		),
		monitor,
	};
};
