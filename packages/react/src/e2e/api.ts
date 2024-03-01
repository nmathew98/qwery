export const createApi = () => {
	const record = {
		a: 1,
		b: 1,
		c: 1,
	};

	const get = async () => record;

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

		for await (const nextValue of subscription) {
			dispatch(previousValue => {
				previousValue.a = nextValue.a;
			});
		}
	};

	return {
		get,
		subscribe,
	};
};
