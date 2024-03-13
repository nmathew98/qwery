import { computed, onMounted, onUnmounted, shallowRef } from "vue";
import type { Dispatch } from "@b.s/incremental";
import { useQweryContext } from "../context";
import { useRememberScroll } from "../use-remember-scroll";
import {
	type InitialValue,
	type UseQweryOptions,
	type MaybePromise,
	type InferData,
	createQwery,
	subscribeQwery,
	makeOnBroadcast,
	makeOnWindowFocus,
	computeInitialQweryValue,
} from "@b.s/qwery-shared";
import type { UseQweryReturnVue } from "./types";

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
}: UseQweryOptions<I, S>): MaybePromise<S, UseQweryReturnVue<I>> => {
	const cache = useQweryContext();
	const abortController = new AbortController();

	const qwery = shallowRef<ReturnType<typeof createQwery>>(
		Object.create(null),
	);

	useRememberScroll();

	// With Vue, things behave like in React, ref reference
	// changes and it causes a rerender
	const rerender = (value?: ReturnType<typeof createQwery> | null) => {
		qwery.value = { ...(value ?? qwery.value ?? Object.create(null)) };
	};

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

		rerender(awaitedQwery);

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

	onUnmounted(() => {
		unsubscribePromise.then(unsubscribe => unsubscribe?.());
	});

	const onBroadcast = makeOnBroadcast(qweryPromise, {
		queryKey,
		cache,
		rerender,
	});

	onMounted(() => {
		qweryPromise.then(qwery => {
			void qwery?.channel?.addEventListener("message", onBroadcast);
		});
	});

	onUnmounted(() => {
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

	onMounted(() => {
		if (!refetchOnWindowFocus) {
			return;
		}

		window.addEventListener("focus", onWindowFocus);
	});

	onUnmounted(() => {
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
			if (!qwery.value?.crdt?.dispatch) {
				return noOpFunction();
			}

			return qwery.value?.crdt?.dispatch(...args);
		},
	}) as Dispatch<InferData<I>>;

	if (suspense) {
		return qweryPromise.then(result => ({
			data: computed(
				() =>
					qwery.value.crdt.data ??
					result?.crdt?.data ??
					(typeof initialValue !== "function" ? initialValue : null),
			),
			dispatch,
			versions: computed(
				() => qwery.value?.crdt?.versions ?? result?.crdt.versions,
			),
		})) as any;
	}

	return {
		data: computed(
			() =>
				qwery.value?.crdt?.data ??
				(typeof initialValue !== "function" ? initialValue : null),
		),
		dispatch,
		versions: computed(() => qwery.value?.crdt?.versions),
	} as any;
};

const noOpFunction = () => {};
