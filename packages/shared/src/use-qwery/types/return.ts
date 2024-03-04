import type { Dispatch } from "@b.s/incremental";
import type { Data, InitialValue } from "./options";

export interface UseQweryReturn<I extends InitialValue> {
	data?: InferData<I>;
	versions?: InferData<I>[];
	dispatch: Dispatch<InferData<I>>;
}

export type MaybePromise<S extends boolean | undefined, R> = S extends true
	? Promise<R>
	: R;

export type InferData<I extends InitialValue> = I extends () => Promise<
	infer DInferred extends Data
>
	? DInferred
	: I;
