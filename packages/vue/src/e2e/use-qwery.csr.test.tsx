import { defineComponent, watch } from "vue";
import { describe, it, afterEach, expect, vitest } from "vitest";
import {
	render,
	screen,
	cleanup,
	waitFor,
	fireEvent,
} from "@testing-library/vue";
import { QweryContext } from "../context";
import { createCacheProvider, makeMonitoredFetch } from "@b.s/incremental";
import { createRedisCache } from "./redis";
import { createApi } from "./api";
import { useQwery } from "../use-qwery";

describe("useQwery csr", () => {
	afterEach(cleanup);

	it("caches queries", async () => {
		const QUERY_KEY = "test";
		const CACHED_RECORD = {
			a: 1,
			b: 1,
			c: 1,
		};

		const CACHE = createCacheProvider();
		CACHE.setCachedValue(QUERY_KEY)(CACHED_RECORD);

		const Component = defineComponent({
			template: `
				<div>a: {{ test.data.value?.a }}</div>
				<div>b: {{ test.data.value?.b }}</div>
				<div>c: {{ test.data.value?.c }}</div>
			`,
			setup: () => {
				const test = useQwery<{ a: number; b: number; c: number }>({
					queryKey: QUERY_KEY,
					onChange: vitest.fn(),
				});

				return { test };
			},
		});

		render(Component, {
			global: {
				provide: {
					[QweryContext]: CACHE,
				},
			},
		});

		await waitFor(() => {
			expect(screen.getByText(`a: ${CACHED_RECORD.a}`)).toBeTruthy();
			expect(screen.getByText(`b: ${CACHED_RECORD.b}`)).toBeTruthy();
			expect(screen.getByText(`c: ${CACHED_RECORD.c}`)).toBeTruthy();
		});
	});

	it("supports async caches", async () => {
		const QUERY_KEY = "test";
		const CACHED_RECORD = {
			a: 1,
			b: 1,
			c: 1,
		};

		const CACHE = createCacheProvider(createRedisCache());
		CACHE.setCachedValue(QUERY_KEY)(CACHED_RECORD);

		const Component = defineComponent({
			template: `
				<div>a: {{ test.data.value?.a }}</div>
				<div>b: {{ test.data.value?.b }}</div>
				<div>c: {{ test.data.value?.c }}</div>
			`,
			setup: () => {
				const test = useQwery<{ a: number; b: number; c: number }>({
					queryKey: QUERY_KEY,
					onChange: vitest.fn(),
				});

				return { test };
			},
		});

		render(Component, {
			global: {
				provide: {
					[QweryContext]: CACHE,
				},
			},
		});

		await waitFor(() => {
			expect(screen.getByText(`a: ${CACHED_RECORD.a}`)).toBeTruthy();
			expect(screen.getByText(`b: ${CACHED_RECORD.b}`)).toBeTruthy();
			expect(screen.getByText(`c: ${CACHED_RECORD.c}`)).toBeTruthy();
		});
	});

	it("supports subscriptions", async () => {
		const Component = defineComponent({
			template: `
				<div>a: {{ test.data.value?.a }}</div>
				<div>b: {{ test.data.value?.b }}</div>
				<div>c: {{ test.data.value?.c }}</div>
			`,
			setup: () => {
				const api = createApi();

				const test = useQwery({
					initialValue: api.get,
					onChange: vitest.fn(),
					subscribe: api.subscribe,
				});

				return { test };
			},
		});

		render(Component);

		await waitFor(() => {
			expect(screen.getByText("a: 9")).toBeTruthy();
			expect(screen.getByText("b: 1")).toBeTruthy();
			expect(screen.getByText("c: 1")).toBeTruthy();
		});
	});

	it("supports conditional queries", async () => {
		const Component = defineComponent({
			template: `
				<div>a: {{ test.data.value?.a }}</div>
				<div>b: {{ test.data.value?.b }}</div>
				<div>c: {{ test.data.value?.c }}</div>
			`,
			setup: () => {
				const api = createApi();
				const test = useQwery({
					initialValue: makeMonitoredFetch({
						fetchFn: api.get,
						enabled: false,
					}),
					onChange: vitest.fn(),
					subscribe: api.subscribe,
				});

				return { test };
			},
		});

		render(Component);

		await waitFor(() => {
			expect(() => screen.getByText("a: 1")).toThrowError();
			expect(() => screen.getByText("b: 1")).toThrowError();
			expect(() => screen.getByText("c: 1")).toThrowError();
		});
	});

	it("refetches on window focus", async () => {
		const API = createApi();

		const getInitialValue: typeof API.get = vitest
			.fn()
			.mockImplementation(API.get);

		const Component = defineComponent({
			template: `
				<div>a: {{ test.data.value?.a }}</div>
				<div>b: {{ test.data.value?.b }}</div>
				<div>c: {{ test.data.value?.c }}</div>
			`,
			setup: () => {
				const test = useQwery<{ a: number; b: number; c: number }>({
					initialValue: getInitialValue,
					onChange: vitest.fn(),
					refetchOnWindowFocus: true,
					refetch: async ({ dispatch, signal: _signal }) => {
						const result = await getInitialValue();

						dispatch(result);
					},
				});

				return { test };
			},
		});

		render(Component);

		fireEvent.focus(window);

		await waitFor(() => {
			expect(getInitialValue).toBeCalledTimes(2);
		});
	});

	it("invokes 'onSuccess' if async 'onChange' resolves", async () => {
		const onChange = vitest
			.fn()
			.mockImplementation(() => Promise.resolve());
		const onSuccess = vitest.fn();
		const onError = vitest.fn();

		const Component = defineComponent({
			template: `
				<div>a: {{ test.data.value?.a }}</div>
				<div>b: {{ test.data.value?.b }}</div>
				<div>c: {{ test.data?.value?.c }}</div>
			`,
			setup: () => {
				const api = createApi();

				const test = useQwery({
					initialValue: api.get,
					onChange,
					onSuccess,
					onError,
				});

				watch(test.data, next => {
					if (next?.a !== 2) {
						test.dispatch(previousValue => {
							previousValue.a = 2;
						});
					}
				});

				return { test };
			},
		});

		render(Component);

		await waitFor(() => {
			expect(screen.getByText("a: 2")).toBeTruthy();
			expect(onSuccess).toBeCalledTimes(1);
			expect(onError).not.toBeCalled();
		});
	});

	it("invokes 'onError' if async 'onChange' rejects", async () => {
		const onChange = vitest.fn().mockImplementation(() => Promise.reject());
		const onSuccess = vitest.fn();
		const onError = vitest.fn();

		const Component = defineComponent({
			template: `
				<div>a: {{ test.data.value?.a }}</div>
				<div>b: {{ test.data.value?.b }}</div>
				<div>c: {{ test.data?.value?.c }}</div>
			`,
			setup: () => {
				const api = createApi();

				const test = useQwery({
					initialValue: api.get,
					onChange,
					onSuccess,
					onError,
				});

				watch(test.data, next => {
					if (next?.a !== 2) {
						test.dispatch(previousValue => {
							previousValue.a = 2;
						});
					}
				});

				return { test };
			},
		});

		render(Component);

		await waitFor(() => {
			expect(screen.getByText("a: 1")).toBeTruthy();
			expect(onError).toBeCalledTimes(1);
			expect(onSuccess).not.toBeCalled();
		});
	});
});
