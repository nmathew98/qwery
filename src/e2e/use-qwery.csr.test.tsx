import React from "react";
import { describe, it, expect, vitest, afterEach } from "vitest";
import { QweryContext, QweryProvider, makeMonitoredFetch, useQwery } from "..";
import {
	render,
	screen,
	act,
	cleanup,
	waitFor,
	fireEvent,
} from "@testing-library/react";
import { createApi } from "./api";
import { createRedisCache } from "./redis";

describe("useQwery csr", () => {
	const BrowserProviders = ({ children }) => (
		<QweryProvider>{children}</QweryProvider>
	);

	afterEach(cleanup);

	it("caches queries", async () => {
		const QUERY_KEY = "test";
		const CACHED_RECORD = {
			a: 1,
			b: 1,
			c: 1,
		};

		const App = () => {
			const qweryContext = React.useContext(QweryContext);

			qweryContext.setCachedValue(QUERY_KEY)(CACHED_RECORD);

			const test = useQwery<{ a: number; b: number; c: number }>({
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

		render(
			<BrowserProviders>
				<App />
			</BrowserProviders>,
		);

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
		const CACHE = createRedisCache();
		CACHE.set(QUERY_KEY, CACHED_RECORD);

		const App = () => {
			const test = useQwery<{ a: number; b: number; c: number }>({
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

		render(
			<QweryProvider store={CACHE}>
				<App />
			</QweryProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(`a: ${CACHED_RECORD.a}`)).toBeTruthy();
			expect(screen.getByText(`b: ${CACHED_RECORD.b}`)).toBeTruthy();
			expect(screen.getByText(`c: ${CACHED_RECORD.c}`)).toBeTruthy();
		});
	});

	it("supports subscriptions", async () => {
		const App = () => {
			const api = createApi();
			const test = useQwery<{ a: number; b: number; c: number }>({
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

		render(
			<BrowserProviders>
				<App />
			</BrowserProviders>,
		);

		await waitFor(() => {
			expect(screen.getByText("a: 9")).toBeTruthy();
			expect(screen.getByText("b: 1")).toBeTruthy();
			expect(screen.getByText("c: 1")).toBeTruthy();
		});
	});

	it("supports conditional queries", async () => {
		const App = () => {
			const api = createApi();
			const test = useQwery<{ a: number; b: number; c: number }>({
				initialValue: makeMonitoredFetch({
					fetchFn: api.get,
					enabled: false,
				}),
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

		render(
			<BrowserProviders>
				<App />
			</BrowserProviders>,
		);

		await waitFor(() => {
			expect(() => screen.getByText("a: 1")).toThrowError();
			expect(() => screen.getByText("b: 1")).toThrowError();
			expect(() => screen.getByText("c: 1")).toThrowError();
		});
	});

	it("refetches on window focus", async () => {
		const API = createApi();

		const getInitialValue = vitest.fn().mockImplementation(API.get);

		const App = () => {
			const test = useQwery<{ a: number; b: number; c: number }>({
				initialValue: getInitialValue,
				onChange: vitest.fn(),
				refetchOnWindowFocus: true,
			});

			return (
				<>
					<div>a: {test.data?.a}</div>
					<div>b: {test.data?.b}</div>
					<div>c: {test.data?.c}</div>
				</>
			);
		};

		render(
			<BrowserProviders>
				<App />
			</BrowserProviders>,
		);

		fireEvent.focusIn(window);

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

		const App = () => {
			const api = createApi();
			const test = useQwery<{ a: number; b: number; c: number }>({
				initialValue: api.get,
				onChange: onChange,
				onSuccess,
				onError,
			});

			React.useEffect(() => {
				if (test.data?.a !== 2) {
					test.dispatch(previousValue => {
						previousValue.a = 2;
					});
				}
			}, [test.data]);

			return (
				<>
					<div>a: {test.data?.a}</div>
					<div>b: {test.data?.b}</div>
					<div>c: {test.data?.c}</div>
				</>
			);
		};

		render(
			<BrowserProviders>
				<App />
			</BrowserProviders>,
		);

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

		const App = () => {
			const api = createApi();
			const test = useQwery<{ a: number; b: number; c: number }>({
				initialValue: api.get,
				onChange: onChange,
				onSuccess,
				onError,
			});

			React.useEffect(() => {
				if (test.data?.a !== 2) {
					test.dispatch(previousValue => {
						previousValue.a = 2;
					});
				}
			}, [test.data]);

			return (
				<>
					<div>a: {test.data?.a}</div>
					<div>b: {test.data?.b}</div>
					<div>c: {test.data?.c}</div>
				</>
			);
		};

		render(
			<BrowserProviders>
				<App />
			</BrowserProviders>,
		);

		await waitFor(() => {
			expect(screen.getByText("a: 1")).toBeTruthy();
			expect(onError).toBeCalledTimes(1);
			expect(onSuccess).not.toBeCalled();
		});
	});
});
