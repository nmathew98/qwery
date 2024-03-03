import type {
	UseQweryReturn as SharedUseQweryReturn,
	InitialValue,
	Data,
} from "@b.s/qwery-shared";
import type { ComputedRef } from "vue";

export interface UseQweryReturn<
	I extends InitialValue,
	DInferred extends Data = I extends () => Promise<
		infer DInferred extends Data
	>
		? DInferred
		: I,
> extends Pick<SharedUseQweryReturn<I, DInferred>, "dispatch"> {
	data: ComputedRef<DInferred | undefined>;
	versions: ComputedRef<DInferred[] | undefined>;
}

export type UseQweryReturnWithSuspense<
	I extends InitialValue,
	S extends boolean | undefined,
> = S extends true ? Promise<UseQweryReturn<I>> : UseQweryReturn<I>;
