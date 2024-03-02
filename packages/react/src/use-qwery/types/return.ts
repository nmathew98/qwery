import type { Dispatch } from "@b.s/incremental";

export interface UseQweryReturn<
	I extends
		| Record<string | number | symbol, any>
		| Array<any>
		| (() => Promise<Record<string | number | symbol, any> | Array<any>>),
	D extends Record<string | number | symbol, any> | Array<any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	DInferred extends
		| Record<string | number | symbol, any>
		| Array<any> = I extends () => Promise<infer DInferred extends D>
		? DInferred
		: I,
> {
	data?: DInferred;
	versions?: DInferred[];
	dispatch: Dispatch<DInferred>;
}

export type UseQweryReturnWithSuspense<
	I extends
		| Record<string | number | symbol, any>
		| Array<any>
		| (() => Promise<Record<string | number | symbol, any> | Array<any>>),
	S extends boolean | undefined,
> = S extends true ? Promise<UseQweryReturn<I>> : UseQweryReturn<I>;
