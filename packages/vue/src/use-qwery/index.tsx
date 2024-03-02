import { createCRDT } from "@b.s/incremental";
import { useQweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import type {
	Data,
	InitialValue,
	UseQweryOptions,
	UseQweryReturnWithSuspense,
} from "./types";
import { computed, onMounted, onUnmounted, ref } from "vue";

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
	const data = ref<any>(null);
	const versions = ref<any>(null);
	const dispatch = ref<any>(null);

	const id = Math.random().toString(36).substring(2);
	const abortController = new AbortController();

	const initializeCRDT = async () => {
		const initialValue = await computeInitialValue();

		if (!initialValue) {
			return;
		}

		const crdt = createCRDT({
			initialValue,
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

				return result;
			},
		});

		const unsubscribe = subscribe?.(proxiedDispatch);

		if (!suspense) {
			data.value = crdt.data;
			dispatch.value = crdt.dispatch;
			versions.value = crdt.versions;
		}

		return { crdt, unsubscribe };
	};

	const initializedCrdt = initializeCRDT();

	const createBroadcastChannel = () => {
		if (!queryKey) {
			return null;
		}

		return new BroadcastChannel(queryKey.toString());
	};

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

				initializedCrdt.then(result => {
					data.value = result?.crdt.data;
					versions.value = result?.crdt.versions;
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

			initializedCrdt.then(result => {
				data.value = result?.crdt.data;
				versions.value = result?.crdt.versions;
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

	const unsubscribe = async () => {
		const unsubscribe = (await initializedCrdt)?.unsubscribe;

		if (unsubscribe instanceof Promise) {
			return void (await unsubscribe)?.();
		}

		return unsubscribe?.();
	};

	const channel = createBroadcastChannel();

	const onBroadcast = async (
		event: MessageEvent<{ id: string; next: Data }>,
	) => {
		const crdt = (await initializedCrdt)?.crdt;

		if (event.data.id === id) {
			return;
		}

		// TODO: remove this
		crdt?.dispatch(event.data.next as any, { isPersisted: true });

		data.value = crdt?.data;
	};

	onMounted(() => {
		channel?.addEventListener("message", onBroadcast);
	});

	onUnmounted(() => {
		channel?.removeEventListener("message", onBroadcast);
		channel?.close();
	});

	const onWindowFocus = async () => {
		const crdt = (await initializedCrdt)?.crdt;
		const dispatch = (await initializedCrdt)?.crdt?.dispatch;

		if (!dispatch) {
			return;
		}

		const proxiedDispatch = new Proxy(dispatch, {
			apply: (dispatch, thisArg, args) => {
				const refetchOptions = {
					isPersisted: true,
				};

				const result = Reflect.apply(dispatch, thisArg, [
					args[0],
					refetchOptions,
				]);

				data.value = crdt?.data;

				return result;
			},
		});

		await refetch?.({
			dispatch: proxiedDispatch,
			signal: abortController.signal,
		});
	};

	onMounted(() => {
		if (!refetchOnWindowFocus) {
			return;
		}

		window.addEventListener("focus", onWindowFocus);
	});

	onUnmounted(() => {
		window.removeEventListener("focus", onWindowFocus);
		unsubscribe();
		abortController.abort();
	});

	useRememberScroll();

	if (suspense) {
		return initializedCrdt.then(() => ({
			data: computed(() => data.value ?? computeInitialValue),
			dispatch: computed(() => dispatch.value ?? noOpFunction),
			versions: computed(() => versions.value),
			refetch: refetch ?? noOpFunction,
		})) as any;
	}

	return {
		data: computed(() => data.value ?? computeInitialValue()),
		dispatch: computed(() => dispatch.value ?? noOpFunction),
		versions: computed(() => versions.value),
		refetch: refetch ?? noOpFunction,
	} as any;
};

const noOpFunction = () => {};
