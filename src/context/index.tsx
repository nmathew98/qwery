import React from "react";
import { createCacheProvider } from "@b.s/incremental";
import {
	ExecutionEnvironment,
	useExecutionEnvironment,
} from "../use-execution-environment";
import { createNoOpCache } from "./no-op-cache";
import type { QweryProviderProps } from "./types";
import type { CacheProvider } from "@b.s/incremental";

export const QweryContext = React.createContext<CacheProvider>(
	Object.create(null),
);

export const QweryProvider: React.FC<
	React.PropsWithChildren<QweryProviderProps>
> = ({ store, children }) => {
	const { executionEnvironment } = useExecutionEnvironment();

	const cache = React.useMemo(() => {
		if (executionEnvironment === ExecutionEnvironment.Server && !store) {
			return createCacheProvider(createNoOpCache());
		}

		if (executionEnvironment === ExecutionEnvironment.Server && store) {
			return createCacheProvider(store);
		}

		return createCacheProvider();
	}, []);

	return (
		<QweryContext.Provider value={cache}>{children}</QweryContext.Provider>
	);
};
