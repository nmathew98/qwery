import React from "react";
import { describe, it, expect, vitest, afterEach } from "vitest";
import { QweryContext, QweryProvider } from "../context";
import { useQwery } from "../use-qwery";
import {
	render,
	screen,
	cleanup,
	waitFor,
	fireEvent,
} from "@testing-library/react";
import { createApi } from "./api";
import { createRedisCache } from "./redis";
import { makeMonitoredFetch } from "@b.s/incremental";

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
			const test = useQwery({
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

		const getInitialValue: typeof API.get = vitest
			.fn()
			.mockImplementation(API.get);

		const App = () => {
			const test = useQwery({
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

		render(
			<BrowserProviders>
				<App />
			</BrowserProviders>,
		);

		await waitFor(() => {
			fireEvent.focus(window);

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
			const test = useQwery({
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
			}, [test]);

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
			const test = useQwery({
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
			}, [test]);

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

	describe("broadcast channel", () => {
		it("it broadcasts updates which are not persisted", async () => {
			let rerenders = 0;

			const App = () => {
				const api = createApi();
				const recordOne = useQwery({
					queryKey: "test",
					initialValue: api.get,
					onChange: vitest.fn(),
					broadcast: true,
				});

				const recordTwo = useQwery({
					queryKey: "test",
					initialValue: api.get,
					onChange: vitest.fn(),
					broadcast: true,
				});

				rerenders++;

				React.useEffect(() => {
					if (!(recordOne.data as Record<string, any>)?.d) {
						recordOne.dispatch(updates => ({
							...updates,
							d: {
								e: {
									g: {
										h: 1,
									},
								},
							},
						}));
					}
				}, [recordOne]);

				return (
					<>
						<div>
							{(recordOne.data as Record<string, any>)?.d?.e.g
								.h ===
								(recordTwo.data as Record<string, any>)?.d?.e.g
									.h &&
							(recordOne.data as Record<string, any>)?.d
								? "true"
								: "false"}
						</div>
					</>
				);
			};

			render(
				<BrowserProviders>
					<App />
				</BrowserProviders>,
			);

			await waitFor(() => {
				expect(screen.getByText("true")).toBeTruthy();
				// 1: initial render
				// 2: data resolves
				// 4: `onChange` rerender (x2)
				expect(rerenders).toBe(4);
			});
		});

		it("broadcasts updates which are persisted", async () => {
			let rerenders = 0;

			const App = () => {
				const api = createApi();
				const recordOne = useQwery({
					queryKey: "test",
					initialValue: api.get,
					onChange: vitest.fn(),
					broadcast: true,
				});

				const recordTwo = useQwery({
					queryKey: "test",
					initialValue: api.get,
					onChange: vitest.fn(),
					broadcast: true,
				});

				rerenders++;

				React.useEffect(() => {
					if (!(recordOne.data as Record<string, any>)?.d) {
						recordOne.dispatch(
							updates => ({
								...updates,
								d: {
									e: {
										g: {
											h: 1,
										},
									},
								},
							}),
							{ isPersisted: true },
						);
					}
				}, [recordOne]);

				return (
					<>
						<div>
							{(recordOne.data as Record<string, any>)?.d?.e.g
								.h ===
								(recordTwo.data as Record<string, any>)?.d?.e.g
									.h &&
							(recordOne.data as Record<string, any>)?.d
								? "true"
								: "false"}
						</div>
					</>
				);
			};

			render(
				<BrowserProviders>
					<App />
				</BrowserProviders>,
			);

			await waitFor(() => {
				expect(screen.getByText("true")).toBeTruthy();
				// 1: initial render
				// 2: data resolves
				// 4: persisted dispatch rerender (x2)
				expect(rerenders).toBe(4);
			});
		});
	});
});
