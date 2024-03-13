import React, { type MutableRefObject } from "react";
import { type CRDT } from "@b.s/incremental";
import { QweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import {
	type InitialValue,
	type UseQweryOptions,
	type UseQweryReturn,
	type MaybePromise,
	createQwery,
	computeInitialQweryValue,
	subscribeQwery,
	makeOnBroadcast,
	makeOnWindowFocus,
	type InferData,
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
}: UseQweryOptions<I, S>): MaybePromise<S, UseQweryReturn<I>> => {
	const [renderCount, setRenderCount] = React.useState(0);
	const [qwery, setQwery] = React.useState<
		| ReturnType<typeof createQwery>
		| Promise<ReturnType<typeof createQwery>>
		| null
	>(null);
	const cache = React.useContext(QweryContext);
	const abortControllerRef = React.useRef(new AbortController());
	const reactivePropsRef = React.useRef({
		onChange,
		onSuccess,
		onError,
		subscribe,
		refetch,
	});

	useRememberScroll();

	reactivePropsRef.current = {
		onChange,
		onSuccess,
		onError,
		subscribe,
		refetch,
	};

	React.useEffect(() => {
		const rerender = () => setRenderCount(renderCount => renderCount + 1);

		const create = async () => {
			const cachedValueOrInitialValue = await computeInitialQweryValue({
				initialValue,
				queryKey,
				cache,
				abortController: abortControllerRef.current,
			});

			if (!cachedValueOrInitialValue) {
				return;
			}

			const qwery = createQwery({
				queryKey,
				initialValue: cachedValueOrInitialValue,
				onChange: forwardArgs(reactivePropsRef, "onChange"),
				onSuccess: forwardArgs(reactivePropsRef, "onSuccess"),
				onError: forwardArgs(reactivePropsRef, "onError"),
				broadcast,
				suspense,
				cache,
				rerender,
				debug,
				abortController: abortControllerRef.current,
			});

			return qwery;
		};

		const assign = async (qwery: ReturnType<typeof create>) => {
			if (suspense) {
				const awaitedQwery = await qwery;

				if (awaitedQwery) {
					setQwery(awaitedQwery);

					return awaitedQwery;
				}

				return;
			}

			return void qwery.then(qwery => {
				if (!qwery) {
					return;
				}

				setQwery(qwery);

				return qwery;
			});
		};

		const qweryPromise = assign(create());

		const sendAbortSignal = abortControllerRef.current.abort.bind(
			abortControllerRef.current,
		);

		return () => {
			qweryPromise.then(qwery => {
				qwery?.channel?.close();
			});

			sendAbortSignal();
		};
	}, []); /* eslint react-hooks/exhaustive-deps: "off" */

	React.useEffect(() => {
		if (!qwery) {
			return;
		}

		const rerender = () => setRenderCount(renderCount => renderCount + 1);

		const observe = async () => {
			const awaitedQwery = (await qwery) as ReturnType<
				typeof createQwery
			>;

			return subscribeQwery(awaitedQwery, {
				rerender,
				subscribe: forwardArgs(reactivePropsRef, "subscribe"),
			});
		};

		const observedPromise = observe();

		return () => {
			observedPromise.then(unsubscribe => unsubscribe?.());
		};
	}, [qwery]);

	React.useEffect(() => {
		if (!qwery) {
			return;
		}

		const rerender = () => setRenderCount(renderCount => renderCount + 1);

		const listen = async () => {
			const awaitedQwery = (await qwery) as ReturnType<
				typeof createQwery
			>;

			const onBroadcast = makeOnBroadcast(awaitedQwery, {
				queryKey,
				cache,
				rerender,
			});

			awaitedQwery.channel?.addEventListener("message", onBroadcast);

			const cleanup = () => {
				awaitedQwery.channel?.removeEventListener(
					"message",
					onBroadcast,
				);
			};

			return cleanup;
		};

		const cleanupPromise = listen();

		return () => {
			cleanupPromise.then(cleanup => cleanup());
		};
	}, [qwery]);

	React.useEffect(() => {
		if (!qwery || !refetchOnWindowFocus) {
			return;
		}

		const rerender = () => setRenderCount(renderCount => renderCount + 1);

		const listen = async () => {
			const awaitedQwery = (await qwery) as ReturnType<
				typeof createQwery
			>;

			const onWindowFocus = makeOnWindowFocus(awaitedQwery, {
				queryKey,
				cache,
				rerender,
				refetch: forwardArgs(reactivePropsRef, "refetch"),
			});

			window.addEventListener("focus", onWindowFocus);

			const cleanup = () => {
				window.removeEventListener("focus", onWindowFocus);
			};

			return cleanup;
		};

		const cleanupPromise = listen();

		return () => {
			cleanupPromise.then(cleanup => cleanup());
		};
	}, [qwery]);

	React.useDebugValue(renderCount);

	if (suspense && qwery instanceof Promise) {
		return qwery.then(qwery => ({
			data:
				qwery.crdt?.data ??
				(typeof initialValue !== "function" ? initialValue : null),
			dispatch: qwery.crdt?.dispatch ?? noOpFunction,
			versions: qwery.crdt?.versions,
		})) as any;
	}

	const crdt = (qwery as ReturnType<typeof createQwery>)?.crdt as
		| CRDT<InferData<I>>
		| undefined;

	return {
		data:
			crdt?.data ??
			(typeof initialValue !== "function" ? initialValue : null),
		dispatch: crdt?.dispatch ?? noOpFunction,
		versions: crdt?.versions,
	} as any;
};

const noOpFunction = () => {};

const forwardArgs =
	(ref: MutableRefObject<any>, prop: string) =>
	(...args: any[]) =>
		ref.current[prop]?.(...args);
