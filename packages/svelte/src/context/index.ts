import { setContext, getContext, hasContext } from "svelte";
import {
	createCacheProvider,
	type CacheProvider,
	type CacheStore,
} from "@b.s/incremental";
import {
	ExecutionEnvironment,
	useExecutionEnvironment,
} from "../use-execution-environment";
import { createNoOpCache } from "@b.s/qwery-shared";

export const QweryContext = Symbol("QweryContext");

export const setQweryContext = (store?: CacheStore) => {
	const { executionEnvironment } = useExecutionEnvironment();

	if (executionEnvironment === ExecutionEnvironment.Server && !store) {
		return setContext(QweryContext, createCacheProvider(createNoOpCache()));
	}

	return setContext(QweryContext, createCacheProvider(store));
};

export const useQweryContext = () => {
	if (!hasContext(QweryContext)) {
		return;
	}

	return getContext<CacheProvider>(QweryContext);
};
