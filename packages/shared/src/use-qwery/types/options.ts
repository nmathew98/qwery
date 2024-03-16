import type {
	CreateCRDTParameters,
	Dispatch,
	DispatchOptions,
} from "@b.s/incremental";
import type { BaseUseQweryOptions } from "./base";

export interface DispatchOptionsInternal extends DispatchOptions {
	isBroadcasted?: boolean;
}

export type UseQweryOptions<
	I extends InitialValue,
	S extends boolean | undefined,
	DInferred extends Data = I extends () => Promise<
		infer DInferred extends Data
	>
		? DInferred
		: I,
> = BaseUseQweryOptions<S, DInferred> &
	Pick<
		CreateCRDTParameters<DInferred, any>,
		"onChange" | "onSuccess" | "onError"
	> & {
		initialValue?: I;
		subscribe?: (
			dispatch: Dispatch<DInferred>,
		) => Promise<(() => void) | void> | (() => void) | void;
	};

export type Data = Record<string | number | symbol, any> | Array<any>;

export type InitialValue<D extends Data = Data> =
	| D
	| ((signal: AbortSignal) => Promise<D>);
