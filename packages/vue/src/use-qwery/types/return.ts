import type { Dispatch } from "@b.s/incremental";
import type { Data, InitialValue } from "./options";
import type { ComputedRef } from "vue";

export interface UseQweryReturn<
	I extends InitialValue,
	DInferred extends Data = I extends () => Promise<
		infer DInferred extends Data
	>
		? DInferred
		: I,
> {
	data: ComputedRef<DInferred | undefined>;
	versions: ComputedRef<DInferred[] | undefined>;
	dispatch: ComputedRef<Dispatch<DInferred>>;
}

export type UseQweryReturnWithSuspense<
	I extends InitialValue,
	S extends boolean | undefined,
> = S extends true ? Promise<UseQweryReturn<I>> : UseQweryReturn<I>;
