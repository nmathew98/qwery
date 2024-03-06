import { makeMonitoredFetch } from "@b.s/incremental";
import { derived, writable } from "svelte/store";

export const useMonitoredFetch = () => {
	const allFetchStatus = writable(Object.create(null));

	const createId = () => Math.random().toString(32).substring(2);

	const monitor = <F extends (...args: any[]) => Promise<any>>(
		fetchFn: F,
	) => {
		const id = createId();

		return makeMonitoredFetch({
			fetchFn,
			onFetching: isFetching =>
				allFetchStatus.update(allFetchStatus => ({
					...allFetchStatus,
					[id]: isFetching,
				})),
		});
	};

	return {
		isFetching: derived(allFetchStatus, $allFetchStatus =>
			Object.values($allFetchStatus).every(Boolean),
		),
		monitor,
	};
};
