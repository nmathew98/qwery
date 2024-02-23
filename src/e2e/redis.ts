export const createRedisCache = () =>
	new Proxy(new Map(), {
		get: (target: Map<any, any>, p: keyof Map<any, any>) => {
			const value = Reflect.get(target, p);

			if (p === "get" && typeof value === "function") {
				return new Proxy(value.bind(target), {
					apply: (get, thisArg, args) => {
						const [key] = args;

						if (!target.has(key)) return null;

						const value = Reflect.apply(get, thisArg, [key]);

						return sleep(100).then(() => value ?? null);
					},
				});
			}

			if (typeof value === "function") {
				return value.bind(target);
			}

			return value;
		},
	});

const sleep = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms));
