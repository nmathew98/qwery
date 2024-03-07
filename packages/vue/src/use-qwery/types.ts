import type {
	UseQweryReturn as SharedUseQweryReturn,
	InitialValue,
} from "@b.s/qwery-shared";
import type { ComputedRef } from "vue";

export type UseQweryReturnVue<I extends InitialValue> = Computed<
	Maybe<Required<Omit<SharedUseQweryReturn<I>, "dispatch">>>
> &
	Pick<SharedUseQweryReturn<I>, "dispatch">;

type Computed<T> = {
	[K in keyof T]: ComputedRef<T[K]>;
};

type Maybe<T> = {
	[K in keyof T]: T[K] | undefined;
};
