import React from "react";
import { makeMonitor } from "@b.s/qwery-shared";

export const useMonitoredFetch = () => {
	const [allFetchStatus, setAllFetchStatus] = React.useState<{
		[key: string]: boolean;
	}>(Object.create(null));

	const monitor = React.useCallback(makeMonitor(setAllFetchStatus), []);

	return {
		isFetching: Object.values(allFetchStatus).every(Boolean),
		monitor,
	};
};
