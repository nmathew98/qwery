export const createNoOpCache = () => ({
	has: () => false,
	get: () => void 0,
	set: () => void 0,
	delete: () => void 0,
});
