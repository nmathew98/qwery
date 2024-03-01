import type {
	CreateCRDTParameters,
	Dispatch,
	Serializable,
} from "@b.s/incremental";

export interface BaseUseQweryOptions<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (
		args?: RefetchableQueryFnParameters<D>,
	) => Promise<D> = () => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
	S extends boolean | undefined = false,
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
	suspense?: S;
}

export interface UseQweryReturn<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
> {
	data?: D;
	dispatch: Dispatch<D>;
	versions?: D[];
}

export interface RefetchableQueryFnParameters<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
> {
	dispatch: Dispatch<D>;
	signal: AbortSignal;
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
	S extends boolean | undefined = false,
> extends BaseUseQweryOptions<D, F, C, S> {
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
	S extends boolean | undefined = false,
> extends BaseUseQweryOptions<D, F, C, S> {
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
	S extends boolean | undefined = false,
> =
	| UseQweryCachedValueOptions<D, F, C, S>
	| UseQweryFetchedValueOptions<D, F, C, S>;
