import { cleanup, render, waitFor, screen } from "@testing-library/vue";
import { renderToString } from "@vue/test-utils";
import { afterEach, describe, expect, it, vitest } from "vitest";
import { defineComponent } from "vue";
import { createRedisCache } from "./redis";
import { createCacheProvider } from "@b.s/incremental";
import { QweryContext } from "../context";
import { useQwery } from "../use-qwery";

describe("useQwery ssr", () => {
	afterEach(cleanup);

	it("initializes to placeholder values", async () => {
		const QUERY_KEY = "test";
		const CACHED_RECORD = {
			a: 1,
			b: 2,
			c: 3,
		};

		const CACHE = createCacheProvider(createRedisCache());
		CACHE.setCachedValue(QUERY_KEY)(CACHED_RECORD);

		const INITIAL_VALUE = {
			a: 1,
			b: 1,
			c: 1,
		};

		await renderSsr(
			defineComponent({
				template: `
					<div>a: {{ test.data.value?.a }}</div>
					<div>b: {{ test.data.value?.b }}</div>
					<div>c: {{ test.data.value?.c }}</div>
				`,
				setup: () => {
					const test = useQwery<{ a: number; b: number; c: number }>({
						queryKey: QUERY_KEY,
						initialValue: INITIAL_VALUE,
						onChange: vitest.fn(),
					});

					return { test };
				},
			}),
			{
				global: {
					provide: {
						[QweryContext]: CACHE,
					},
				},
			},
		);

		await waitFor(() => {
			expect(screen.getByText(`a: ${INITIAL_VALUE.a}`)).toBeTruthy();
			expect(screen.getByText(`b: ${INITIAL_VALUE.b}`)).toBeTruthy();
			expect(screen.getByText(`c: ${INITIAL_VALUE.c}`)).toBeTruthy();
		});
	});
});

export const renderSsr = async (
	Component,
	options?: Parameters<typeof renderToString>[1],
) => {
	const envWindow = window;
	/* eslint no-global-assign: "off" */
	/// @ts-expect-error: `window` is `undefined` in ssr
	window = undefined;

	const serverRendered = await renderToString(Component, options);

	global.window = envWindow;

	const container = document.createElement("div");
	document.body.appendChild(container);
	container.innerHTML = serverRendered;

	return render(defineComponent({}), { container });
};
