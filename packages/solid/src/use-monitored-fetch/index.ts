import { createSignal } from "solid-js";
import { makeMonitor } from "@b.s/qwery-shared";

export const useMonitoredFetch = () => {
	const [allFetchStatus, setAllFetchStatus] = createSignal<{
		[key: string]: boolean;
	}>(Object.create(null));

	const monitor = makeMonitor(setAllFetchStatus);

	return {
		isFetching: () => Object.values(allFetchStatus()).every(Boolean),
		monitor,
	};
};
