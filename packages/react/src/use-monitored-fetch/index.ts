import React from "react";
import { makeMonitoredFetch } from "@b.s/incremental";

export const useMonitoredFetch = () => {
	const [allFetchStatus, setAllFetchStatus] = React.useState(
		Object.create(null),
	);

	const createId = () => Math.random().toString(32).substring(2);

	const monitor = <F extends (...args: any[]) => Promise<any>>(
		fetchFn: F,
	) => {
		const id = createId();

		return makeMonitoredFetch({
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
