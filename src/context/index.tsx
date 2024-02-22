import React from "react";
import { createCacheProvider } from "@b.s/incremental";

export const QweryContext = React.createContext(Object.create(null));

export const QweryProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const cache = React.useMemo(createCacheProvider, []);

	return (
		<QweryContext.Provider value={cache}>{children}</QweryContext.Provider>
	);
};
