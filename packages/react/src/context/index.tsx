import React from "react";
import { createCacheProvider } from "@b.s/incremental";
import {
	ExecutionEnvironment,
	useExecutionEnvironment,
} from "../use-execution-environment";
import type { QweryProviderProps } from "./types";
import type { CacheProvider } from "@b.s/incremental";
import { createNoOpCache } from "@b.s/qwery-shared";

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

		return createCacheProvider(store);
	}, [store, executionEnvironment]);

	return (
		<QweryContext.Provider value={cache}>{children}</QweryContext.Provider>
	);
};
