import { derived, get, writable } from "svelte/store";
import { onDestroy, onMount } from "svelte";
import type { Dispatch } from "@b.s/incremental";
import { useQweryContext } from "../context";
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
import type { UseQweryReturnSvelte } from "./types";

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
}: UseQweryOptions<I, S>): MaybePromise<S, UseQweryReturnSvelte<I>> => {
	const cache = useQweryContext();
	const abortController = new AbortController();

	const qwery = writable<ReturnType<typeof createQwery> | null>(null);

	useRememberScroll();

	// With Svelte stores, using `update` does not trigger a rerender
	// if references (of fields) do not change, so with `crdt` even if we
	// spread `qwery` since the reference for `crdt` is stable
	// there are no rerenders, it seems to be granularly reactive
	// `set` seems to cause a definite rerender
	const rerender = () =>
		qweryPromise.then(result => {
			if (!result) {
				return;
			}

			qwery.set(result);
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

	const assign = async (value: ReturnType<typeof create>) => {
		const awaitedQwery = await value;

		if (!awaitedQwery) {
			return;
		}

		qwery.set(awaitedQwery);

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

	onDestroy(() => {
		unsubscribePromise.then(unsubscribe => unsubscribe?.());
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

	onDestroy(() => {
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

	onDestroy(() => {
		if (!refetchOnWindowFocus) {
			return;
		}

		window.removeEventListener("focus", onWindowFocus);
	});

	let value;
	const dispatch = new Proxy(noOpFunction, {
		apply: (
			noOpFunction,
			_thisArg,
			args: Parameters<Dispatch<InferData<I>>>,
		) => {
			value ??= get(qwery);

			if (!value?.crdt.dispatch) {
				return noOpFunction();
			}

			const result = value.crdt.dispatch(...args);

			return result;
		},
	}) as Dispatch<InferData<I>>;

	if (suspense) {
		return qweryPromise.then(result => ({
			data: derived(
				qwery,
				$qwery =>
					$qwery?.crdt.data ??
					result?.crdt.data ??
					(typeof initialValue !== "function" ? initialValue : null),
			),
			dispatch,
			versions: derived(
				qwery,
				$qwery => $qwery?.crdt.versions ?? result?.crdt.versions,
			),
		})) as any;
	}

	return {
		data: derived(
			qwery,
			$qwery =>
				$qwery?.crdt.data ??
				(typeof initialValue !== "function" ? initialValue : null),
		),
		dispatch,
		versions: derived(qwery, $qwery => $qwery?.crdt.versions),
	} as any;
};

const noOpFunction = () => {};
