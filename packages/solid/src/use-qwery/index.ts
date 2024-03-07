import { type CRDT, createCRDT, type Dispatch } from "@b.s/incremental";
import { QweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import type {
	InitialValue,
	UseQweryOptions,
	MaybePromise,
	InferData,
} from "@b.s/qwery-shared";
import { createSignal, onCleanup, onMount, useContext } from "solid-js";
import type { UseQweryReturnSolid } from "./types";

export const useQwery = <
	I extends InitialValue,
	S extends boolean | undefined = false,
>({
	queryKey,
	initialValue,
	refetch,
	onChange,
	onSuccess = noOpFunction,
	onError = noOpFunction,
	subscribe,
	debug = false,
	refetchOnWindowFocus = false,
	broadcast = false,
	suspense = false,
}: UseQweryOptions<I, S>): MaybePromise<S, UseQweryReturnSolid<I>> => {
	const context = useContext(QweryContext);

	const id = Math.random().toString(36).substring(2);
	const abortController = new AbortController();

	const [crdt, setCrdt] = createSignal<{
		data: InferData<I> | null;
		versions: InferData<I>[] | null;
		dispatch: Dispatch<InferData<I>> | null;
	}>({
		data: null,
		versions: null,
		dispatch: null,
	});

	const updateCRDT = (value: CRDT<InferData<I>>) => {
		setCrdt({
			data: value.data,
			versions: value.versions,
			dispatch: value.dispatch,
		});
	};

	const initializeCRDT = async () => {
		const proxiedOnChange = new Proxy(onChange, {
			apply: (onChange, thisArg, args) => {
				const result = Reflect.apply(onChange, thisArg, args);

				if (broadcast) {
					const channel = createBroadcastChannel();

					channel?.postMessage({
						id,
						next: args[0],
					});
					channel?.close();
				}

				if (!result) {
					if (queryKey) {
						context?.makeOnChange?.(queryKey)(args[0]);
					}

					initializedCRDT.then(result => {
						if (!result?.crdt) {
							return;
						}

						updateCRDT(result?.crdt);
					});
				}

				if (suspense && result instanceof Promise) {
					return (result as Promise<unknown>).catch(error => {
						onError(args[0], args[1]);

						throw error;
					});
				}

				return result;
			},
		});

		const proxiedOnSuccess = new Proxy(onSuccess, {
			apply: (onSuccess, thisArg, args) => {
				Reflect.apply(onSuccess, thisArg, args);

				if (queryKey) {
					context?.makeOnChange?.(queryKey)(args[0]);
				}

				initializedCRDT.then(result => {
					if (!result?.crdt) {
						return;
					}

					updateCRDT(result.crdt);
				});
			},
		});

		const computeInitialValue = async () => {
			const cachedValue = queryKey
				? await context?.getCachedValue?.(queryKey)
				: null;

			if (initialValue instanceof Function) {
				if (cachedValue) {
					return cachedValue;
				}

				const fetchedValue = await initialValue(abortController.signal);

				if (queryKey) {
					context?.setCachedValue?.(queryKey);
				}

				return fetchedValue;
			}

			return cachedValue ?? initialValue;
		};

		const computedInitialValue = await computeInitialValue();

		if (!computedInitialValue) {
			return;
		}

		const crdt = createCRDT({
			initialValue: computedInitialValue,
			onChange: proxiedOnChange,
			onSuccess: proxiedOnSuccess,
			onError: onError,
			trackVersions: debug,
		});

		const proxiedDispatch = new Proxy(crdt.dispatch, {
			apply: (dispatch, thisArg, args) => {
				const subscribeOptions = {
					isPersisted: true,
				};

				const result = Reflect.apply(dispatch, thisArg, [
					args[0],
					subscribeOptions,
				]);

				updateCRDT(crdt);

				return result;
			},
		});

		const unsubscribe = subscribe?.(proxiedDispatch);

		if (!suspense) {
			updateCRDT(crdt);
		}

		return { crdt, unsubscribe };
	};

	const initializedCRDT = initializeCRDT();

	const createBroadcastChannel = () => {
		if (!queryKey) {
			return null;
		}

		return new BroadcastChannel(queryKey.toString());
	};

	const onBroadcast = async (
		event: MessageEvent<{ id: string; next: InferData<I> }>,
	) => {
		const crdt = (await initializedCRDT)?.crdt;

		if (!crdt || event.data.id === id) {
			return;
		}

		crdt?.dispatch(event.data.next, { isPersisted: true });

		updateCRDT(crdt);
	};

	const onWindowFocus = async () => {
		const crdt = (await initializedCRDT)?.crdt;

		if (!crdt) {
			return;
		}

		const proxiedDispatch = new Proxy(crdt.dispatch, {
			apply: (dispatch, thisArg, args) => {
				const refetchOptions = {
					isPersisted: true,
				};

				const result = Reflect.apply(dispatch, thisArg, [
					args[0],
					refetchOptions,
				]);

				if (queryKey) {
					context?.setCachedValue?.(queryKey)(args[0]);
				}

				updateCRDT(crdt);

				return result;
			},
		});

		await refetch?.({
			dispatch: proxiedDispatch,
			signal: abortController.signal,
		});
	};

	const channel = createBroadcastChannel();

	onMount(() => {
		channel?.addEventListener("message", onBroadcast);

		if (refetchOnWindowFocus) {
			window.addEventListener("focus", onWindowFocus);
		}
	});

	onCleanup(() => {
		const unsubscribe = async () => {
			const unsubscribe = (await initializedCRDT)?.unsubscribe;

			if (unsubscribe instanceof Promise) {
				return void (await unsubscribe)?.();
			}

			return unsubscribe?.();
		};

		channel?.removeEventListener("message", onBroadcast);
		channel?.close();

		window.removeEventListener("focus", onWindowFocus);
		unsubscribe();
		abortController.abort();
	});

	useRememberScroll();

	const computeInitialValue = () => {
		if (typeof initialValue !== "function") {
			return initialValue;
		}
	};

	const dispatch = new Proxy(noOpFunction, {
		apply: (
			noOpFunction,
			_thisArg,
			args: Parameters<Dispatch<InferData<I>>>,
		) => {
			if (!crdt().dispatch) {
				return noOpFunction();
			}

			return crdt().dispatch?.(...args);
		},
	}) as Dispatch<InferData<I>>;

	if (suspense) {
		return initializedCRDT.then(result => ({
			data: () =>
				crdt().data ?? result?.crdt.data ?? computeInitialValue(),
			dispatch,
			versions: () => crdt().versions ?? result?.crdt.versions,
		})) as any;
	}

	return {
		data: () => crdt().data ?? computeInitialValue(),
		dispatch,
		versions: () => crdt().versions,
	} as any;
};

const noOpFunction = () => {};
