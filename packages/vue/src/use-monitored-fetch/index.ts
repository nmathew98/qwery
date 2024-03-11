import {
	makeMonitoredFetch,
	type MakeMonitoredParameters,
} from "@b.s/incremental";
import { computed, ref } from "vue";
import { createId } from "@b.s/qwery-shared";

export const useMonitoredFetch = () => {
	const allFetchStatus = ref<{ [key: string]: boolean }>(Object.create(null));

	const monitor = <F extends (...args: any[]) => Promise<any>>(
		fetchFn: F,
		options: Omit<
			MakeMonitoredParameters<F>,
			"onFetching" | "fetchFn"
		> = Object.create(null),
	) => {
		const id = createId();

		return makeMonitoredFetch({
			...options,
			fetchFn,
			onFetching: isFetching => {
				allFetchStatus.value = {
					...allFetchStatus.value,
					[id]: isFetching,
				};
			},
		});
	};

	return {
		isFetching: computed(() =>
			Object.values(allFetchStatus.value).every(Boolean),
		),
		monitor,
	};
};
