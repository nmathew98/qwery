import type { DispatchOptionsInternal, UseQweryOptions } from "./types";
import { createBroadcastChannel } from "./create-broadcast-channel";
import { createId } from "../utilities";
import type { CacheProvider, Serializable } from "@b.s/incremental";
import { createCRDT } from "@b.s/incremental";

export const createQwery = ({
	queryKey,
	initialValue,
	onChange,
	onSuccess = noOpFunction,
	onError = noOpFunction,
	broadcast,
	suspense,
	cache,
	rerender,
	debug,
	abortController = new AbortController(),
}: Omit<UseQweryOptions<any, any>, "queryKey"> & {
	queryKey?: Serializable;
	abortController: AbortController;
	cache?: CacheProvider;
	rerender: any;
}) => {
	const id = createId();
	const channel = !broadcast ? null : createBroadcastChannel(queryKey);

	const proxiedOnChange = new Proxy(onChange, {
		apply: (onChange, thisArg, args) => {
			const result = Reflect.apply(onChange, thisArg, args);

			// If the result is not a `Promise` then `result` is falsy
			// and `result` is complete
			if (!result && queryKey && broadcast) {
				channel?.postMessage({
					id,
					next: args[0],
				});
			}

			if (!result) {
				if (queryKey) {
					cache?.makeOnChange?.(queryKey)(args[0]);
				}

				rerender();
			}

			if (suspense && result instanceof Promise) {
				return (result as Promise<unknown>).catch(error => {
					onError?.(args[0], args[1]);

					throw error;
				});
			}

			return result;
		},
	});

	const proxiedOnSuccess = new Proxy(onSuccess, {
		apply: (onSuccess, thisArg, args) => {
			// If `onChange` returns a result then assume that is
			// the API response and likely has to be merged in by `onSuccess`
			// which should return the complete document
			// (creating a new record and we don't have `uuid`s for example)
			const next = args[0];
			const merged = Reflect.apply(onSuccess, thisArg, args);

			const final = merged || next;

			// The final version of data is given by `final`
			if (queryKey && broadcast) {
				channel?.postMessage({
					id,
					next: final,
				});
			}

			if (queryKey) {
				cache?.makeOnChange?.(queryKey)(final);
			}

			rerender();

			// Relied upon by `incremental` to `createNewVersion`
			return merged;
		},
	});

	const crdt = createCRDT({
		initialValue: initialValue,
		onChange: proxiedOnChange,
		onSuccess: proxiedOnSuccess,
		onError: onError,
		trackVersions: debug,
	});

	const proxiedDispatch = new Proxy(crdt.dispatch, {
		apply: (dispatch, thisArg, args) => {
			const options = args[1] as DispatchOptionsInternal;

			const result = Reflect.apply(dispatch, thisArg, args);

			// In this case `onChange` will not be triggered,
			// so if `broadcast` is true then we will have to trigger it
			// after `dispatch`ing
			if (options?.isPersisted && !options?.isBroadcasted && broadcast) {
				channel?.postMessage({
					id,
					next: result,
				});
			}

			// `onChange` will not be triggered so we have to force a rerender here
			if (options?.isPersisted) {
				if (queryKey) {
					cache?.makeOnChange?.(queryKey)(result);
				}

				rerender();
			}

			return result;
		},
	});

	const broadcastingCrdt = Object.assign(crdt, {
		dispatch: proxiedDispatch,
	});

	return { id, crdt: broadcastingCrdt, abortController, channel };
};

export const subscribeQwery = (
	qwery: ReturnType<typeof createQwery> | undefined,
	{
		rerender,
		subscribe,
	}: Pick<UseQweryOptions<any, any>, "subscribe"> & { rerender: any },
) => {
	if (!qwery) {
		return;
	}

	const proxiedDispatch = new Proxy(qwery.crdt.dispatch, {
		apply: (dispatch, thisArg, args) => {
			const subscribeOptions: DispatchOptionsInternal = {
				isPersisted: true,
				isBroadcasted: true,
			};

			const result = Reflect.apply(dispatch, thisArg, [
				args[0],
				subscribeOptions,
			]);

			rerender();

			return result;
		},
	});

	const maybeUnsubscribe = subscribe?.(proxiedDispatch);

	const unsubscribe = () => {
		if (maybeUnsubscribe instanceof Promise) {
			return void maybeUnsubscribe.then(unsubscribe => unsubscribe?.());
		}

		return maybeUnsubscribe?.();
	};

	return unsubscribe;
};

export const computeInitialQweryValue = async ({
	initialValue,
	queryKey,
	cache,
	abortController,
}: {
	initialValue: any;
	queryKey?: Serializable;
	cache?: CacheProvider;
	abortController: AbortController;
}) => {
	const cachedValue = queryKey
		? await cache?.getCachedValue?.(queryKey)
		: null;

	if (initialValue instanceof Function) {
		if (cachedValue) {
			return cachedValue;
		}

		const fetchedValue = await initialValue(abortController.signal);

		if (queryKey) {
			cache?.setCachedValue?.(queryKey);
		}

		return fetchedValue;
	}

	return cachedValue ?? initialValue;
};

const noOpFunction = () => {};
