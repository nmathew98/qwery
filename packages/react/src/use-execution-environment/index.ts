export enum ExecutionEnvironment {
	Browser = 1,
	Server,
}

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
