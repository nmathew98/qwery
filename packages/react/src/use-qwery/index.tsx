import React from "react";
import { type CRDT, createCRDT } from "@b.s/incremental";
import { QweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import type {
	Data,
	InitialValue,
	UseQweryOptions,
	UseQweryReturnWithSuspense,
} from "@b.s/qwery-shared";

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
	const [renderCount, setRenderCount] = React.useState(0);
	const context = React.useContext(QweryContext);
	const crdtRef = React.useRef<
		null | Promise<CRDT<any> | undefined> | CRDT<any> | undefined
	>(null);
	const abortControllerRef = React.useRef(new AbortController());
	const id = React.useId();

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

				return void setRenderCount(renderCount => renderCount + 1);
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

			setRenderCount(renderCount => renderCount + 1);
		},
	});

	useRememberScroll();

	React.useEffect(() => {
		const computeInitialValue = async () => {
			const cachedValue = queryKey
				? await context?.getCachedValue?.(queryKey)
				: null;

			if (initialValue instanceof Function) {
				if (cachedValue) {
					return cachedValue;
				}

				const fetchedValue = await initialValue(
					abortControllerRef.current.signal,
				);

				if (queryKey) {
					context?.setCachedValue?.(queryKey)(fetchedValue);
				}

				return fetchedValue;
			}

			return cachedValue ?? initialValue;
		};

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

					setRenderCount(renderCount => renderCount + 1);

					return result;
				},
			});

			const unsubscribe = subscribe?.(proxiedDispatch);

			if (!suspense) {
				setRenderCount(renderCount => renderCount + 1);
			}

			return { crdt, unsubscribe };
		};

		const setCrdtRef = async (
			initializedCRDT: ReturnType<typeof initializeCRDT>,
		) => {
			crdtRef.current = suspense
				? initializedCRDT.then(result => result?.crdt)
				: (await initializedCRDT)?.crdt;
		};

		const initializedCrdt = initializeCRDT();
		setCrdtRef(initializedCrdt);

		const unsubscribe = async () => {
			const unsubscribe = (await initializedCrdt)?.unsubscribe;

			if (unsubscribe instanceof Promise) {
				return void (await unsubscribe)?.();
			}

			return unsubscribe?.();
		};

		const onWindowFocus = async () => {
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

					setRenderCount(renderCount => renderCount + 1);

					return result;
				},
			});

			await refetch?.({
				dispatch: proxiedDispatch,
				signal: abortControllerRef.current.signal,
			});
		};

		if (refetchOnWindowFocus) {
			window.addEventListener("focus", onWindowFocus);
		}

		const sendAbortSignal = abortControllerRef.current.abort.bind(
			abortControllerRef.current,
		);
		return () => {
			window.removeEventListener("focus", onWindowFocus);
			unsubscribe();
			sendAbortSignal();
		};
	}, []); /* eslint react-hooks/exhaustive-deps: "off" */

	React.useEffect(() => {
		const channel = createBroadcastChannel();

		const onBroadcast = async (
			event: MessageEvent<{ id: string; next: Data }>,
		) => {
			const crdt = await crdtRef.current;

			if (event.data.id === id) {
				return;
			}

			crdt?.dispatch(event.data.next, { isPersisted: true });

			setRenderCount(renderCount => renderCount + 1);
		};

		channel?.addEventListener("message", onBroadcast);

		return () => {
			channel?.removeEventListener("message", onBroadcast);
			channel?.close();
		};
	}, []); /* eslint react-hooks/exhaustive-deps: "off" */

	React.useDebugValue(renderCount);

	const computeInitialValue = () => {
		if (typeof initialValue !== "function") {
			return initialValue;
		}
	};

	if (suspense && crdtRef.current instanceof Promise) {
		return crdtRef.current.then(crdt => ({
			data: crdt?.data ?? computeInitialValue(),
			dispatch: crdt?.dispatch ?? noOpFunction,
			versions: crdt?.versions,
		})) as any;
	}

	const crdt = crdtRef.current as CRDT<Data> | undefined;

	return {
		data: crdt?.data ?? computeInitialValue(),
		dispatch: crdt?.dispatch ?? noOpFunction,
		versions: crdt?.versions,
	} as any;
};

const noOpFunction = () => {};
