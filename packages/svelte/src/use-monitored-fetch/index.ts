import { derived, writable } from "svelte/store";
import { makeMonitor } from "@b.s/qwery-shared";

export const useMonitoredFetch = () => {
	const allFetchStatus = writable<{ [key: string]: boolean }>(
		Object.create(null),
	);

	const monitor = makeMonitor(allFetchStatus.update);

	return {
		isFetching: derived(allFetchStatus, $allFetchStatus =>
			Object.values($allFetchStatus).every(Boolean),
		),
		monitor,
	};
};
