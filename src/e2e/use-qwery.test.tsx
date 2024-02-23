import { describe, it } from "vitest";
import { QweryProvider } from "..";
import { createRedisCache } from "./redis";

describe("useQwery", () => {
	const SsrProviders = ({ children }) => (
		<QweryProvider store={createRedisCache()}>{children}</QweryProvider>
	);

	const BrowserProviders = ({ children }) => (
		<QweryProvider>{children}</QweryProvider>
	);

	it.todo("caches queries");

	it.todo("supports subscriptions");

	it.todo("supports conditional queries");

	it.todo("refetches on window focus");

	it.todo("invokes `onSuccess` if async `onChange` resolves");

	it.todo("invokes `onError` if async `onChange` rejects");

	// @vitest-environment node
	it.todo("supports ssr");
});
