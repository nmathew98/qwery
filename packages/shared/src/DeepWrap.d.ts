export type DeepWrap<T, U> = {
	[K in keyof U]: DeepWrap<T, U[K]> | T<U>;
};
