import React, { Suspense } from "react";
import ReactDOMServer from "react-dom/server";
import { describe, it, expect, vitest, afterEach } from "vitest";
import {
	ExecutionEnvironment,
	QweryProvider,
	useExecutionEnvironment,
	useQwery,
} from "..";
import { createRedisCache } from "./redis";
import {
	render,
	screen,
	cleanup,
	waitFor,
	fireEvent,
} from "@testing-library/react";
import { createApi } from "./api";

describe("useQwery ssr", () => {
	const SsrProviders = ({ children }) => (
		<QweryProvider store={createRedisCache()}>{children}</QweryProvider>
	);

	afterEach(cleanup);

	it("renders correctly", async () => {
		const spy = vitest.spyOn(global.console, "error");

		const INITIAL_VALUE = {
			a: 1,
			b: 1,
			c: 1,
		};

		const App = () => {
			const { executionEnvironment } = useExecutionEnvironment();

			const test = useQwery<typeof INITIAL_VALUE>({
				initialValue:
					executionEnvironment === ExecutionEnvironment.Server
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

			expect(spy).toBeCalled();
		});
	});

	it("supports subscriptions", async () => {
		const spy = vitest.spyOn(global.console, "error");

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

		renderSsr(
			<SsrProviders>
				<App />
			</SsrProviders>,
		);

		await waitFor(() => {
			expect(screen.getByText("a: 9")).toBeTruthy();
			expect(screen.getByText("b: 1")).toBeTruthy();
			expect(screen.getByText("c: 1")).toBeTruthy();

			expect(spy).not.toBeCalled();
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

		renderSsr(
			<SsrProviders>
				<App />
			</SsrProviders>,
		);

		fireEvent.focusIn(window);

		await waitFor(() => {
			expect(getInitialValue).toBeCalledTimes(2);
		});
	});
});

export const renderSsr = (ui: React.ReactNode) => {
	const envWindow = window;
	/// @ts-expect-error
	window = undefined;

	const serverRendered = ReactDOMServer.renderToString(ui);

	global.window = envWindow;

	const container = document.createElement("div");
	document.body.appendChild(container);
	container.innerHTML = serverRendered;

	render(ui, { hydrate: true, container });
};
