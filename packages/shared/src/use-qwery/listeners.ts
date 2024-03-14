import type { Data, DispatchOptionsInternal } from "./types";
import type { createQwery } from "./create-qwery";

export const makeOnBroadcast =
	(
		qwery: MaybePromise<ReturnType<typeof createQwery> | undefined>,
		{ queryKey, cache, rerender },
	) =>
	async (event: MessageEvent<{ id: string; next: Data }>) => {
		const awaitedQwery = await qwery;

		if (!awaitedQwery) {
			return;
		}

		if (event.data.id === awaitedQwery.id) {
			return;
		}

		const options: DispatchOptionsInternal = {
			isPersisted: true,
			isBroadcasted: true,
		};

		if (queryKey) {
			cache?.setCachedValue?.(queryKey)(event.data.next);
		}

		awaitedQwery.crdt?.dispatch(event.data.next, options);

		rerender();
	};

export const makeOnWindowFocus =
	(
		qwery: MaybePromise<ReturnType<typeof createQwery> | undefined>,
		{ queryKey, cache, rerender, refetch },
	) =>
	async () => {
		const awaitedQwery = await qwery;

		if (!awaitedQwery) {
			return;
		}

		const proxiedDispatch = new Proxy(awaitedQwery.crdt.dispatch, {
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

		refetch?.({
			dispatch: proxiedDispatch,
			signal: awaitedQwery.abortController.signal,
		});
	};

type MaybePromise<T> = T | Promise<T>;
