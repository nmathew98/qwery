import {
	makeMonitoredFetch,
	type MakeMonitoredParameters,
} from "@b.s/incremental";
import { createId } from "../utilities";

export const makeMonitor =
	update =>
	<F extends (...args: any[]) => Promise<any>>(
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
				update(allFetchStatus => ({
					...allFetchStatus,
					[id]: isFetching,
				})),
		});
	};
