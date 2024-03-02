import type { CreateCRDTParameters, Dispatch } from "@b.s/incremental";
import type { BaseUseQweryOptions } from "./base";

export type UseQweryUntaggedOptions<
	I extends D | ((signal: AbortSignal) => Promise<D>),
	S extends boolean | undefined,
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	DInferred extends
		| Record<string | number | symbol, any>
		| Array<any> = I extends () => Promise<infer DInferred extends D>
		? DInferred
		: I,
	C extends (next: DInferred, previous: DInferred) => unknown = (
		next: DInferred,
		previous: DInferred,
	) => unknown,
> = BaseUseQweryOptions<S, DInferred> &
	Pick<
		CreateCRDTParameters<DInferred, C>,
		"onChange" | "onSuccess" | "onError"
	> & {
		initialValue: I;
		subscribe?: (
			dispatch: Dispatch<DInferred>,
		) => Promise<(() => void) | void> | (() => void) | void;
	};

export type UseQweryTaggedOptions<
	I extends D | ((signal: AbortSignal) => Promise<D>),
	S extends boolean | undefined,
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
	DInferred extends
		| Record<string | number | symbol, any>
		| Array<any> = I extends () => Promise<infer DInferred extends D>
		? DInferred
		: I,
	C extends (next: DInferred, previous: DInferred) => unknown = (
		next: DInferred,
		previous: DInferred,
	) => unknown,
> = BaseUseQweryOptions<S, DInferred> &
	Pick<
		CreateCRDTParameters<DInferred, C>,
		"onChange" | "onSuccess" | "onError"
	> & {
		initialValue?: I;
		subscribe?: (
			dispatch: Dispatch<DInferred>,
		) => Promise<(() => void) | void> | (() => void) | void;
	};

export type UseQweryOptions<
	I extends D | ((signal: AbortSignal) => Promise<D>),
	S extends boolean | undefined,
	D extends Record<string | number | symbol, any> =
		| Record<string | number | symbol, any>
		| Array<any>,
> = UseQweryUntaggedOptions<I, S> | UseQweryTaggedOptions<I, S>;
