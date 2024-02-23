import React from "react";
import ReactDOMServer from "react-dom/server";
import { describe, it, expect, vitest, afterEach } from "vitest";
import { QweryContext, QweryProvider, useQwery } from "..";
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
				onChange: () => {},
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
				onChange: () => {},
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
			expect(screen.getByText(`a: 9`)).toBeTruthy();
			expect(screen.getByText(`b: 1`)).toBeTruthy();
			expect(screen.getByText(`c: 1`)).toBeTruthy();
		});
	});

	it("refetches on window focus", async () => {
		const API = createApi();

		const getInitialValue = vitest.fn().mockImplementation(API.get);

		const App = () => {
			const test = useQwery<{ a: number; b: number; c: number }>({
				initialValue: getInitialValue,
				onChange: () => {},
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
	const container = document.createElement("div");
	document.body.appendChild(container);
	container.innerHTML = ReactDOMServer.renderToString(ui);
	render(ui, { hydrate: true, container });
};
