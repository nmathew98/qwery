import React from "react";
import { createCacheProvider } from "@b.s/incremental";
import type { QweryProviderProps } from "./types";
import type { CacheProvider } from "@b.s/incremental";
import { createNoOpCache, isBrowser } from "@b.s/qwery-shared";

export const QweryContext = React.createContext<CacheProvider>(
	Object.create(null),
);

export const QweryProvider: React.FC<
	React.PropsWithChildren<QweryProviderProps>
> = ({ store, children }) => {
	const cache = React.useMemo(() => {
		if (isBrowser() && !store) {
			return createCacheProvider(createNoOpCache());
		}

		return createCacheProvider(store);
	}, [store]);

	return (
		<QweryContext.Provider value={cache}>{children}</QweryContext.Provider>
	);
};
