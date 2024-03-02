import { describe, it, afterEach, expect, vitest } from "vitest";
import {
	render,
	screen,
	cleanup,
	waitFor,
	fireEvent,
} from "@testing-library/vue";
import { QweryContext } from "../context";
import { createCacheProvider } from "@b.s/incremental";
import { createRedisCache } from "./redis";
import { createApi } from "./api";
import CachesQueries from "./components/csr/CachedQueries.vue";
import Subscriptions from "./components/csr/Subscriptions.vue";
import ConditionalQueries from "./components/csr/ConditionalQueries.vue";
import RefetchWindowFocus from "./components/csr/RefetchWindowFocus.vue";
import QueryDispatch from "./components/csr/QueryDispatch.vue";

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

		render(CachesQueries, {
			global: {
				provide: {
					[QweryContext]: CACHE,
				},
			},
			props: {
				queryKey: QUERY_KEY,
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

		render(CachesQueries, {
			global: {
				provide: {
					[QweryContext]: CACHE,
				},
			},
			props: {
				queryKey: QUERY_KEY,
			},
		});

		await waitFor(() => {
			expect(screen.getByText(`a: ${CACHED_RECORD.a}`)).toBeTruthy();
			expect(screen.getByText(`b: ${CACHED_RECORD.b}`)).toBeTruthy();
			expect(screen.getByText(`c: ${CACHED_RECORD.c}`)).toBeTruthy();
		});
	});

	it("supports subscriptions", async () => {
		render(Subscriptions);

		await waitFor(() => {
			expect(screen.getByText("a: 9")).toBeTruthy();
			expect(screen.getByText("b: 1")).toBeTruthy();
			expect(screen.getByText("c: 1")).toBeTruthy();
		});
	});

	it("supports conditional queries", async () => {
		render(ConditionalQueries);

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

		render(RefetchWindowFocus, {
			props: {
				getInitialValue,
			},
		});

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

		render(QueryDispatch, {
			props: {
				onChange,
				onSuccess,
				onError,
			},
		});

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

		render(QueryDispatch, {
			props: {
				onChange,
				onSuccess,
				onError,
			},
		});

		await waitFor(() => {
			expect(screen.getByText("a: 1")).toBeTruthy();
			expect(onError).toBeCalledTimes(1);
			expect(onSuccess).not.toBeCalled();
		});
	});
});
