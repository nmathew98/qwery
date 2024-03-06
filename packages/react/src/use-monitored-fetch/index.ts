import React from "react";
import {
	makeMonitoredFetch,
	type MakeMonitoredParameters,
} from "@b.s/incremental";

export const useMonitoredFetch = () => {
	const [allFetchStatus, setAllFetchStatus] = React.useState(
		Object.create(null),
	);

	const createId = () => Math.random().toString(32).substring(2);

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
			onFetching: isFetching =>
				setAllFetchStatus(allFetchStatus => ({
					...allFetchStatus,
					[id]: isFetching,
				})),
		});
	};

	return {
		isFetching: Object.values(allFetchStatus).every(Boolean),
		monitor,
	};
};
