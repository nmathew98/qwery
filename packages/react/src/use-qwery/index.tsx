import React from "react";
import { type CRDT, createCRDT, diff } from "@b.s/incremental";
import { QweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import type {
	RefetchableQueryFnParameters,
	UseQweryOptions,
	UseQweryReturn,
} from "./types";

export const useQwery = <
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (
		args?: RefetchableQueryFnParameters<D>,
	) => Promise<D> = () => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
	S extends boolean | undefined = false,
>({
	queryKey,
	initialValue,
	onChange,
	onSuccess = noOpFunction,
	onError = noOpFunction,
	subscribe,
	debug = false,
	refetchOnWindowFocus = false,
	broadcast = false,
	suspense = false,
}: UseQweryOptions<D, F, C, S>): S extends true
	? Promise<UseQweryReturn<D>>
	: UseQweryReturn<D> => {
	const [renderCount, setRenderCount] = React.useState(0);
	const context = React.useContext(QweryContext);
	const crdtRef = React.useRef<
		null | undefined | CRDT<D> | Promise<CRDT<D> | undefined>
	>(null);
	const abortControllerRef = React.useRef(new AbortController());

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
					next: args[0],
					previous: args[1],
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
				? context?.getCachedValue(queryKey)
				: null;

			if (initialValue instanceof Function) {
				return (await cachedValue) ?? (await initialValue());
			}

			return (await cachedValue) ?? initialValue;
		};

		const initializeCRDT = async () => {
			const initialValue = (await computeInitialValue()) as D;

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
			initializedCrdt: ReturnType<typeof initializeCRDT>,
		) => {
			crdtRef.current = suspense
				? initializedCrdt.then(result => result?.crdt)
				: (await initializedCrdt)?.crdt;
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

			await (initialValue as F)({
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
			event: MessageEvent<{ next: D; previous: D }>,
		) => {
			const updates = event.data;

			const crdt = await crdtRef.current;

			if (updates.next === crdt?.data) {
				return;
			}

			crdt?.dispatch(updates.next, { isPersisted: true });

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

	const crdt = crdtRef.current as CRDT<D> | undefined;

	return {
		data: crdt?.data ?? computeInitialValue(),
		dispatch: crdt?.dispatch ?? noOpFunction,
		versions: crdt?.versions,
	} as any;
};

const noOpFunction = () => {};
