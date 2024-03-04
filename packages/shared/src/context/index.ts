import type { CacheStore } from "@b.s/incremental";

export const createNoOpCache = (): CacheStore => ({
	has: () => false,
	get: () => void 0,
	set: () => void 0,
	delete: () => void 0,
});
