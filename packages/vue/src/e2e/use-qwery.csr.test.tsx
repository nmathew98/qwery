import { describe, it, afterEach, expect } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/vue";
import CachesQueries from "./components/csr/CachesQueries.vue";
import { QweryContext } from "../context";
import { createCacheProvider } from "@b.s/incremental";
import { createRedisCache } from "./redis";

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
});
