import { createContext, type Component, type ParentProps } from "solid-js";
import { createCacheProvider } from "@b.s/incremental";
import {
	ExecutionEnvironment,
	useExecutionEnvironment,
} from "../use-execution-environment";
import type { QweryProviderProps } from "./types";
import type { CacheProvider } from "@b.s/incremental";
import { createNoOpCache } from "@b.s/qwery-shared";

export const QweryContext = createContext<CacheProvider>(Object.create(null));

export const QweryProvider: Component<
	ParentProps<QweryProviderProps>
> = props => {
	const { executionEnvironment } = useExecutionEnvironment();

	const createContextValue = () => {
		if (
			executionEnvironment === ExecutionEnvironment.Server &&
			!props.store
		) {
			return createCacheProvider(createNoOpCache());
		}

		return createCacheProvider(props.store);
	};

	return (
		<QweryContext.Provider value={createContextValue()}>
			{props.children}
		</QweryContext.Provider>
	);
};
