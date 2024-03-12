import type { Data, DispatchOptionsInternal } from "./types";
import type { createQwery } from "./create-qwery";

export const makeOnBroadcast =
	(qwery: ReturnType<typeof createQwery>, { queryKey, cache, rerender }) =>
	(event: MessageEvent<{ id: string; next: Data }>) => {
		if (event.data.id === qwery.id) {
			return;
		}

		const options: DispatchOptionsInternal = {
			isPersisted: true,
			isBroadcasted: true,
		};

		if (queryKey) {
			cache?.setCachedValue?.(queryKey)(event.data.next);
		}

		qwery.crdt?.dispatch(event.data.next, options);

		rerender();
	};

export const makeOnWindowFocus = (
	qwery: ReturnType<typeof createQwery>,
	{ queryKey, cache, rerender, refetch },
) => {
	const proxiedDispatch = new Proxy(qwery.crdt.dispatch, {
		apply: (dispatch, thisArg, args) => {
			const refetchOptions = {
				isPersisted: true,
			};

			const result = Reflect.apply(dispatch, thisArg, [
				args[0],
				refetchOptions,
			]);

			if (queryKey) {
				cache?.setCachedValue?.(queryKey)(args[0]);
			}

			rerender();

			return result;
		},
	});

	return () =>
		refetch?.({
			dispatch: proxiedDispatch,
			signal: qwery.abortController.signal,
		});
};
