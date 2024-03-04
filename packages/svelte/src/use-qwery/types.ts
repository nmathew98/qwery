import type {
	UseQweryReturn as SharedUseQweryReturn,
	InitialValue,
} from "@b.s/qwery-shared";
import type { Readable } from "svelte/store";

export type UseQweryReturn<I extends InitialValue> = Derived<
	Maybe<Required<Omit<SharedUseQweryReturn<I>, "dispatch">>>
> &
	Pick<SharedUseQweryReturn<I>, "dispatch">;

type Derived<T> = {
	[K in keyof T]: Readable<T[K]>;
};

type Maybe<T> = {
	[K in keyof T]: T[K] | undefined;
};
