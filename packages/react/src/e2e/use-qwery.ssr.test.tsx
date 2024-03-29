import React from "react";
import ReactDOMServer from "react-dom/server";
import { describe, it, expect, vitest, afterEach } from "vitest";
import { QweryProvider } from "../context";
import { useQwery } from "../use-qwery";
import { createRedisCache } from "./redis";
import {
	render,
	screen,
	cleanup,
	waitFor,
	fireEvent,
} from "@testing-library/react";
import { createApi } from "./api";
import { isBrowser } from "@b.s/qwery-shared";

describe("useQwery ssr", () => {
	const SsrProviders = ({ children }) => (
		<QweryProvider>{children}</QweryProvider>
	);

	afterEach(cleanup);

	it("renders correctly if there are hydration issues", async () => {
		const spy = vitest.spyOn(global.console, "error");

		const INITIAL_VALUE = {
			a: 1,
			b: 1,
			c: 1,
		};

		const App = () => {
			const test = useQwery({
				initialValue: !isBrowser()
					? { a: 2, b: 3, c: 4 }
					: INITIAL_VALUE,
				onChange: vitest.fn(),
			});

			return (
				<>
					<div>a: {test.data?.a}</div>
					<div>b: {test.data?.b}</div>
					<div>c: {test.data?.c}</div>
				</>
			);
		};

		renderSsr(
			<SsrProviders>
				<App />
			</SsrProviders>,
		);

		await waitFor(() => {
			expect(screen.getByText("a: 1")).toBeTruthy();
			expect(screen.getByText("b: 1")).toBeTruthy();
			expect(screen.getByText("c: 1")).toBeTruthy();
		});

		expect(spy).toBeCalled();
	});

	it("supports async caches", async () => {
		const spy = vitest.spyOn(global.console, "error");

		const QUERY_KEY = "test";
		const CACHED_RECORD = {
			a: 1,
			b: 1,
			c: 1,
		};
		const CACHE = createRedisCache();
		CACHE.set(QUERY_KEY, CACHED_RECORD);

		const App = () => {
			const test = useQwery<typeof CACHED_RECORD>({
				queryKey: QUERY_KEY,
				onChange: vitest.fn(),
			});

			return (
				<>
					<div>a: {test.data?.a}</div>
					<div>b: {test.data?.b}</div>
					<div>c: {test.data?.c}</div>
				</>
			);
		};

		renderSsr(
			<QweryProvider store={CACHE}>
				<App />
			</QweryProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(`a: ${CACHED_RECORD.a}`)).toBeTruthy();
			expect(screen.getByText(`b: ${CACHED_RECORD.b}`)).toBeTruthy();
			expect(screen.getByText(`c: ${CACHED_RECORD.c}`)).toBeTruthy();
		});

		expect(spy).not.toBeCalled();
	});

	it("supports subscriptions", async () => {
		const App = () => {
			const api = createApi();
			const test = useQwery({
				initialValue: api.get,
				onChange: vitest.fn(),
				subscribe: api.subscribe,
			});

			return (
				<>
					<div>a: {test.data?.a}</div>
					<div>b: {test.data?.b}</div>
					<div>c: {test.data?.c}</div>
				</>
			);
		};

		renderSsr(
			<SsrProviders>
				<App />
			</SsrProviders>,
		);

		await waitFor(() => {
			expect(screen.getByText("a: 9")).toBeTruthy();
			expect(screen.getByText("b: 1")).toBeTruthy();
			expect(screen.getByText("c: 1")).toBeTruthy();
		});
	});

	it("refetches on window focus", async () => {
		const API = createApi();
		const getInitialValue = vitest.fn().mockImplementation(API.get);

		const App = () => {
			const test = useQwery<Awaited<ReturnType<typeof getInitialValue>>>({
				initialValue: getInitialValue,
				onChange: vitest.fn(),
				refetchOnWindowFocus: true,
				refetch: async ({ dispatch, signal: _signal }) => {
					const result = await getInitialValue();

					dispatch(result);
				},
			});

			return (
				<>
					<div>a: {test.data?.a}</div>
					<div>b: {test.data?.b}</div>
					<div>c: {test.data?.c}</div>
				</>
			);
		};

		renderSsr(
			<SsrProviders>
				<App />
			</SsrProviders>,
		);

		await waitFor(() => {
			fireEvent.focus(window);

			expect(getInitialValue).toBeCalledTimes(2);
		});
	});
});

export const renderSsr = (ui: React.ReactNode) => {
	const envWindow = window;
	/* eslint no-global-assign: "off" */
	/// @ts-expect-error: `window` is `undefined` in ssr
	window = undefined;

	const serverRendered = ReactDOMServer.renderToString(ui);

	global.window = envWindow;

	const container = document.createElement("div");
	document.body.appendChild(container);
	container.innerHTML = serverRendered;

	return void render(ui, { hydrate: true, container });
};
