import type {
	UseQweryReturn as SharedUseQweryReturn,
	InitialValue,
	Data,
} from "@b.s/qwery-shared";
import type { ComputedRef } from "vue";

export type UseQweryReturn<
	I extends InitialValue,
	DInferred extends Data = I extends () => Promise<
		infer DInferred extends Data
	>
		? DInferred
		: I,
> = Computed<
	Maybe<Required<Omit<SharedUseQweryReturn<I, DInferred>, "dispatch">>>
> &
	Pick<SharedUseQweryReturn<I, DInferred>, "dispatch">;

export type UseQweryReturnWithSuspense<
	I extends InitialValue,
	S extends boolean | undefined,
> = S extends true ? Promise<UseQweryReturn<I>> : UseQweryReturn<I>;

type Computed<T> = {
	[K in keyof T]: ComputedRef<T[K]>;
};

type Maybe<T> = {
	[K in keyof T]: T[K] | undefined;
};
