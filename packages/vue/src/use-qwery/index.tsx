import { computed, onMounted, onUnmounted, shallowReactive } from "vue";
import { createCRDT, type CRDT, type Dispatch } from "@b.s/incremental";
import { useQweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import type {
	Data,
	InitialValue,
	UseQweryOptions,
	UseQweryReturnWithSuspense,
} from "./types";

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
}: UseQweryOptions<I, S>): UseQweryReturnWithSuspense<I, S> => {
	const context = useQweryContext();

	const id = Math.random().toString(36).substring(2);
	const abortController = new AbortController();

	const crdt = shallowReactive<{
		data: Data | null;
		versions: Data[] | null;
		dispatch: Dispatch<Data> | null;
	}>({
		data: null,
		versions: null,
		dispatch: null,
	});

	const updateCRDT = (value: CRDT<any>) => {
		crdt.data = value.data;
		crdt.versions = value.versions;
		crdt.dispatch = value.dispatch;
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
				? context?.getCachedValue?.(queryKey)
				: null;

			if (initialValue instanceof Function) {
				return (
					(await cachedValue) ??
					(await initialValue(abortController.signal))
				);
			}

			return (await cachedValue) ?? initialValue;
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
		event: MessageEvent<{ id: string; next: Data }>,
	) => {
		const crdt = (await initializedCRDT)?.crdt;

		if (!crdt || event.data.id === id) {
			return;
		}

		/// @ts-ignore: not sure why
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

	onMounted(() => {
		channel?.addEventListener("message", onBroadcast);

		if (refetchOnWindowFocus) {
			window.addEventListener("focus", onWindowFocus);
		}
	});

	onUnmounted(() => {
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

	const computeInitialValueTest = () => {
		if (typeof initialValue !== "function") {
			return initialValue;
		}
	};

	if (suspense) {
		return initializedCRDT.then(result => ({
			data: computed(
				() =>
					crdt.data ?? result?.crdt.data ?? computeInitialValueTest(),
			),
			get dispatch() {
				return crdt.dispatch ?? result?.crdt.dispatch ?? noOpFunction;
			},
			versions: computed(() => crdt.versions ?? result?.crdt.versions),
		})) as any;
	}

	return {
		data: computed(() => crdt.data ?? computeInitialValueTest()),
		get dispatch() {
			return crdt.dispatch ?? noOpFunction;
		},
		versions: computed(() => crdt.versions),
	} as any;
};

const noOpFunction = () => {};
