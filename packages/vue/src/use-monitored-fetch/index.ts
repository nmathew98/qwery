import { makeMonitoredFetch } from "@b.s/incremental";
import { computed, ref } from "vue";

export const useMonitoredFetch = () => {
	const allFetchStatus = ref(Object.create(null));

	const createId = () => Math.random().toString(32).substring(2);

	const monitor = <F extends (...args: any[]) => Promise<any>>(
		fetchFn: F,
	) => {
		const id = createId();

		return makeMonitoredFetch({
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
			Object.values(allFetchStatus).every(Boolean),
		),
		monitor,
	};
};
