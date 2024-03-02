import { hasInjectionContext, inject, provide } from "vue";
import {
	createCacheProvider,
	type CacheProvider,
	type CacheStore,
} from "@b.s/incremental";
import {
	ExecutionEnvironment,
	useExecutionEnvironment,
} from "../use-execution-environment";
import { createNoOpCache } from "./no-op-cache";

export const QweryContext = Symbol("QweryContext");

export const provideQweryContext = (store?: CacheStore) => {
	const { executionEnvironment } = useExecutionEnvironment();

	if (executionEnvironment === ExecutionEnvironment.Server && !store) {
		return provide(QweryContext, createCacheProvider(createNoOpCache()));
	}

	return provide(QweryContext, createCacheProvider(store));
};

export const useQweryContext = () => {
	if (!hasInjectionContext()) {
		return;
	}

	return inject<CacheProvider>(QweryContext);
};
