import { inject, provide } from "vue";
import type { QweryProviderProps } from "./types";
import { createCacheProvider, type CacheProvider } from "@b.s/incremental";
import {
	ExecutionEnvironment,
	useExecutionEnvironment,
} from "../use-execution-environment";
import { createNoOpCache } from "./no-op-cache";

export const QweryContext = Symbol("QweryContext");

export const provideQweryContext = ({ store }: QweryProviderProps) => {
	const { executionEnvironment } = useExecutionEnvironment();

	if (executionEnvironment === ExecutionEnvironment.Server && !store) {
		return provide(QweryContext, createCacheProvider(createNoOpCache()));
	}

	return provide(QweryContext, store);
};

export const useQweryContext = () => {
	const cache = inject<CacheProvider>(QweryContext);

	return cache;
};
