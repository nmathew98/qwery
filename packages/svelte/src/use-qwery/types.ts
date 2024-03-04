import type {
	UseQweryReturn as SharedUseQweryReturn,
	InitialValue,
	Data,
} from "@b.s/qwery-shared";
import type { Readable } from "svelte/store";

export type UseQweryReturn<
	I extends InitialValue,
	DInferred extends Data = I extends () => Promise<
		infer DInferred extends Data
	>
		? DInferred
		: I,
> = Derived<
	Maybe<Required<Omit<SharedUseQweryReturn<I, DInferred>, "dispatch">>>
> &
	Pick<SharedUseQweryReturn<I, DInferred>, "dispatch">;

type Derived<T> = {
	[K in keyof T]: Readable<T[K]>;
};

type Maybe<T> = {
	[K in keyof T]: T[K] | undefined;
};
