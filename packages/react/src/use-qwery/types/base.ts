import type { Serializable } from "@b.s/incremental";
import type { RefetchQueryFn } from "./refetch";

export interface BaseUseQweryUntaggedOptions<
	S extends boolean | undefined = false,
> {
	initialValue: any;
	queryKey?: never;
	debug?: boolean;
	refetchOnWindowFocus?: never | false;
	refetch?: never;
	broadcast?: never;
	suspense?: S;
}

export interface BaseUseQweryTaggedOptions<
	S extends boolean | undefined = false,
> {
	initialValue?: any;
	queryKey: Serializable;
	debug?: boolean;
	refetchOnWindowFocus?: never | false;
	refetch?: never;
	broadcast?: boolean;
	suspense?: S;
}

export interface BaseUseQweryRefetchUntaggedOptions<
	S extends boolean | undefined = false,
> {
	initialValue: any;
	queryKey?: never;
	debug?: boolean;
	refetchOnWindowFocus?: never | false;
	refetch?: never;
	broadcast?: never;
	suspense?: S;
}

export interface BaseUseQweryRefetchTaggedOptions<
	S extends boolean | undefined = false,
	DInferred extends Record<string | number | symbol, any> | Array<any> =
		| Record<string | number | symbol, any>
		| Array<any>,
> {
	initialValue: any;
	queryKey?: Serializable;
	debug?: boolean;
	refetchOnWindowFocus?: true;
	refetch: RefetchQueryFn<DInferred>;
	broadcast?: never;
	suspense?: S;
}

export type BaseUseQweryOptions<
	S extends boolean | undefined = false,
	DInferred extends Record<string | number | symbol, any> | Array<any> =
		| Record<string | number | symbol, any>
		| Array<any>,
> =
	| BaseUseQweryUntaggedOptions<S>
	| BaseUseQweryTaggedOptions<S>
	| BaseUseQweryRefetchUntaggedOptions<S>
	| BaseUseQweryRefetchTaggedOptions<S, DInferred>;
