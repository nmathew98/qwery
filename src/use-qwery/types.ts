import type {
	CreateCRDTParameters,
	Dispatch,
	Serializable,
} from "@b.s/incremental";

export interface BaseUseQweryOptions<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (dispatch?: any) => Promise<D> = (dispatch?: any) => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
> extends Pick<
		CreateCRDTParameters<D, C>,
		"onChange" | "onSuccess" | "onError"
	> {
	queryKey?: Serializable;
	initialValue?: D | F;
	subscribe?: (
		dispatch: Dispatch<D>,
	) => Promise<(() => void) | void> | (() => void) | void;
	debug?: boolean;
	refetchOnWindowFocus?: boolean;
	broadcast?: BroadcastChannel | boolean;
}

export interface UseQweryCachedValueOptions<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (dispatch?: any) => Promise<D> = (dispatch?: any) => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
> extends BaseUseQweryOptions<D, F, C> {
	queryKey: Serializable;
	initialValue?: D | F;
}

export interface UseQweryFetchedValueOptions<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (dispatch?: any) => Promise<D> = (dispatch?: any) => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
> extends BaseUseQweryOptions<D, F, C> {
	queryKey?: Serializable;
	initialValue: D | F;
}

export type UseQweryOptions<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (dispatch?: any) => Promise<D> = (dispatch?: any) => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
> = UseQweryCachedValueOptions<D, F, C> | UseQweryFetchedValueOptions<D, F, C>;
