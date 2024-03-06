export * from "./types";

export const mapReduceMaybePromise =
	<Fns extends Fn[]>(...fns: Fns) =>
	(...args: any[]): MaybePromise<SomeReturnsPromise<Fns[number]>> => {
		const reduced = fns.reduce(
			(acc, fn) => {
				const result = fn(...args);

				return {
					hasPromise: acc.hasPromise || result instanceof Promise,
					results: [...acc.results, result],
				};
			},
			{ results: [] as any[], hasPromise: false },
		);

		if (reduced.hasPromise) {
			return Promise.allSettled(reduced.results) as any;
		}

		return reduced.results as any;
	};

type Fn = (...args: any[]) => any;
type SomeReturnsPromise<T> = T extends (...args: any[]) => infer R
	? R extends Promise<any>
		? true
		: never
	: never;
type MaybePromise<P> = P extends true ? Promise<void> : void;
