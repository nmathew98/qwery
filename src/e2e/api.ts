export const createApi = () => {
	const record = {
		a: 1,
		b: 1,
		c: 1,
	};

	const get = async () => record;

	const put = async (updates: Record<string, any>) => {
		record.a = updates.a ?? record.a;
		record.b = updates.b ?? record.b;
		record.c = updates.c ?? record.c;
	};

	const subscribe = async dispatch => {
		async function* createSubscription() {
			for (let i = 0; i < 10; i++) {
				const updatedRecord = {
					...record,
					a: i,
				};

				yield await Promise.resolve(updatedRecord);
			}
		}

		const subscription = createSubscription();

		const dispatcher = setInterval(async () => {
			const nextValue = await subscription.next();

			if (nextValue.done) {
				clearInterval(dispatcher);
			}

			dispatch(previousValue => {
				previousValue.a = (nextValue.value as typeof record).a;
			});
		}, 500);
	};

	return {
		get,
		put,
		subscribe,
	};
};
