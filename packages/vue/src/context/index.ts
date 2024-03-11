import { hasInjectionContext, inject, provide } from "vue";
import {
	createCacheProvider,
	type CacheProvider,
	type CacheStore,
} from "@b.s/incremental";
import { createNoOpCache, isBrowser } from "@b.s/qwery-shared";

export const QweryContext = Symbol("QweryContext");

export const provideQweryContext = (store?: CacheStore) => {
	if (isBrowser() && !store) {
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
