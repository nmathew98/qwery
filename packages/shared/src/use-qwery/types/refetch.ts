import type { Dispatch } from "@b.s/incremental";
import type { Data } from "./options";

export interface RefetchQueryParameters<D extends Data> {
	dispatch: Dispatch<D>;
	signal: AbortSignal;
}

export type RefetchQueryFn<D extends Data> = (
	args: RefetchQueryParameters<D>,
) => Promise<void> | void;
