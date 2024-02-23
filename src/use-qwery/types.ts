export interface BaseUseQweryOptions<
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	F extends (dispatch?: any) => Promise<D> = (dispatch?: any) => Promise<D>,
	C extends (next: D, previous: D) => unknown = (
		next: D,
		previous: D,
	) => unknown,
> {
	queryKey?: any; // TODO: `Serializable`
	initialValue?: D | F;
	onChange: C; // TODO: Extends
	onSuccess?: (next: D, previous: D) => void; // TODO: Extends
	onError?: (next: D, previous: D) => void; // TODO: Extends
	subscribe?: (dispatch: any) => void; // TODO
	debug?: boolean;
	refetchOnWindowFocus?: boolean;
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
	queryKey: any; // TODO: `Serializable`
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
	queryKey?: any; // TODO: `Serializable`
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
