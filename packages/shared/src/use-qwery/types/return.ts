import type { Dispatch } from "@b.s/incremental";
import type { Data, InitialValue } from "./options";

export interface UseQweryReturn<
	I extends InitialValue,
	DInferred extends Data = I extends () => Promise<
		infer DInferred extends Data
	>
		? DInferred
		: I,
> {
	data?: DInferred;
	versions?: DInferred[];
	dispatch: Dispatch<DInferred>;
}

export type MaybePromise<S extends boolean | undefined, R> = S extends true
	? Promise<R>
	: R;
