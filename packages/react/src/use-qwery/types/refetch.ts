import type { Dispatch } from "@b.s/incremental";

export interface RefetchQueryParameters<
	D extends Record<string | number | symbol, any> | Array<any>,
> {
	dispatch: Dispatch<D>;
	signal: AbortSignal;
}

export type RefetchQueryFn<
	D extends Record<string | number | symbol, any> | Array<any>,
> = (args: RefetchQueryParameters<D>) => Promise<void> | void;
