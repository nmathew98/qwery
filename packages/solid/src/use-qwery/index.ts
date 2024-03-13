import { createSignal, onCleanup, onMount, useContext } from "solid-js";
import type { Dispatch } from "@b.s/incremental";
import { QweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import {
	type InitialValue,
	type UseQweryOptions,
	type MaybePromise,
	type InferData,
	createQwery,
	computeInitialQweryValue,
	subscribeQwery,
	makeOnBroadcast,
	makeOnWindowFocus,
} from "@b.s/qwery-shared";
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
	const cache = useContext(QweryContext);
	const abortController = new AbortController();

	const [qwery, setQwery] = createSignal<ReturnType<
		typeof createQwery
	> | null>(null);

	useRememberScroll();

	const rerender = () =>
		setQwery(qwery => {
			if (!qwery) {
				return null;
			}

			return { ...qwery };
		});

	const create = async () => {
		const cachedValueOrInitialValue = await computeInitialQweryValue({
			initialValue,
			queryKey,
			cache,
			abortController,
		});

		if (!cachedValueOrInitialValue) {
			return;
		}

		const qwery = createQwery({
			queryKey,
			initialValue: cachedValueOrInitialValue,
			onChange,
			onSuccess,
			onError,
			broadcast,
			suspense,
			cache,
			rerender,
			debug,
			abortController,
		});

		return qwery;
	};

	const assign = async (qwery: ReturnType<typeof create>) => {
		const awaitedQwery = await qwery;

		if (!awaitedQwery) {
			return;
		}

		setQwery(awaitedQwery);

		return awaitedQwery;
	};

	const qweryPromise = assign(create());

	const subscription = async () => {
		const awaitedQwery = (await qweryPromise) as ReturnType<
			typeof createQwery
		>;

		return subscribeQwery(awaitedQwery, {
			rerender,
			subscribe,
		});
	};
	const unsubscribePromise = subscription();

	onCleanup(() => {
		unsubscribePromise.then(unsubscribe => unsubscribe());
	});

	const onBroadcast = makeOnBroadcast(qweryPromise, {
		queryKey,
		cache,
		rerender,
	});

	onMount(() => {
		qweryPromise.then(qwery => {
			void qwery?.channel?.addEventListener("message", onBroadcast);
		});
	});

	onCleanup(() => {
		qweryPromise.then(qwery => {
			void qwery?.channel?.removeEventListener("message", onBroadcast);
		});
	});

	const onWindowFocus = makeOnWindowFocus(qweryPromise, {
		queryKey,
		cache,
		rerender,
		refetch,
	});

	onMount(() => {
		if (!refetchOnWindowFocus) {
			return;
		}

		window.addEventListener("focus", onWindowFocus);
	});

	onCleanup(() => {
		if (!refetchOnWindowFocus) {
			return;
		}

		window.removeEventListener("focus", onWindowFocus);
	});

	const dispatch = new Proxy(noOpFunction, {
		apply: (
			noOpFunction,
			_thisArg,
			args: Parameters<Dispatch<InferData<I>>>,
		) => {
			if (!qwery()?.crdt.dispatch) {
				return noOpFunction();
			}

			return qwery()?.crdt.dispatch?.(...args);
		},
	}) as Dispatch<InferData<I>>;

	if (suspense) {
		return qweryPromise.then(result => ({
			data: () =>
				qwery()?.crdt.data ??
				result?.crdt.data ??
				(typeof initialValue !== "function" ? initialValue : null),
			dispatch,
			versions: () => qwery()?.crdt.versions ?? result?.crdt.versions,
		})) as any;
	}

	return {
		data: () =>
			qwery()?.crdt.data ??
			(typeof initialValue !== "function" ? initialValue : null),
		dispatch,
		versions: () => qwery()?.crdt.versions,
	} as any;
};

const noOpFunction = () => {};
