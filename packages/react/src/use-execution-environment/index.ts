import { ExecutionEnvironment } from "@b.s/qwery-shared";

export { ExecutionEnvironment } from "@b.s/qwery-shared";

export const useExecutionEnvironment = () => {
	const isBrowser = Boolean(
		typeof window !== "undefined" &&
			window.document &&
			window.document.createElement,
	);

	return {
		executionEnvironment: isBrowser
			? ExecutionEnvironment.Browser
			: ExecutionEnvironment.Server,
	};
};
