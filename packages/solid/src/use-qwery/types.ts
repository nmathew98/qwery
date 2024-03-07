import type {
	UseQweryReturn as SharedUseQweryReturn,
	InitialValue,
} from "@b.s/qwery-shared";
import type { Accessor } from "solid-js";

export type UseQweryReturn<I extends InitialValue> = Computed<
	Maybe<Required<Omit<SharedUseQweryReturn<I>, "dispatch">>>
> &
	Pick<SharedUseQweryReturn<I>, "dispatch">;

type Computed<T> = {
	[K in keyof T]: Accessor<T[K]>;
};

type Maybe<T> = {
	[K in keyof T]: T[K] | undefined;
};
