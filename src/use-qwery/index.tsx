import React from "react";
import { type CRDT, createCRDT, type Dispatch } from "@b.s/incremental";
import { QweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import type { UseQweryOptions } from "./types";

export const useQwery = <
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (dispatch?: Dispatch<D>) => Promise<D> = (
		dispatch?: Dispatch<D>,
	) => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
>({
	queryKey,
	initialValue,
	onChange,
	onSuccess = noOpFunction,
	onError = noOpFunction,
	subscribe,
	debug = false,
	refetchOnWindowFocus = false,
}: UseQweryOptions<D, F, C>) => {
	const [renderCount, setRenderCount] = React.useState(0);
	const context = React.useContext(QweryContext);
	const crdtRef = React.useRef<null | CRDT<D>>(null);

	const proxiedOnChange = new Proxy(onChange, {
		apply: (onChange, thisArg, args) => {
			const result = Reflect.apply(onChange, thisArg, args);

			if (!result) {
				if (queryKey) {
					context?.makeOnChange?.(queryKey).apply(null, [args[0]]);
				}

				setRenderCount(renderCount => renderCount + 1);
			}

			return result;
		},
	});

	const proxiedOnSuccess = new Proxy(onSuccess, {
		apply: (onSuccess, thisArg, args) => {
			Reflect.apply(onSuccess, thisArg, args);

			if (queryKey) {
				context?.makeOnChange?.(queryKey).apply(null, [args[0]]);
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

			crdtRef.current = crdt;

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

			setRenderCount(renderCount => renderCount + 1);

			return { crdt, unsubscribe };
		};

		const initializedCrdt = initializeCRDT();

		const unsubscribe = async () => {
			(await initializedCrdt)?.unsubscribe?.();
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

					return result;
				},
			});

			await (initialValue as F)(proxiedDispatch);
		};

		if (refetchOnWindowFocus) {
			window.addEventListener("focusin", onWindowFocus);
		}

		return () => {
			window.removeEventListener("focusin", onWindowFocus);
			unsubscribe();
		};
	}, []);

	React.useDebugValue(crdtRef.current?.versions, versions =>
		JSON.stringify(
			{
				renderCount,
				versions: JSON.stringify(versions ?? [], null, 2),
			},
			null,
			2,
		),
	);

	const computeInitialValue = () => {
		if (typeof initialValue !== "function") {
			return initialValue;
		}
	};

	return {
		data: crdtRef.current?.data ?? computeInitialValue(),
		dispatch: crdtRef.current?.dispatch ?? noOpFunction,
		versions: crdtRef.current?.versions ?? [],
	};
};

const noOpFunction = () => {};
