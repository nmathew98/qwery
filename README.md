![Tests](https://github.com/nmathew98/qwery/actions/workflows/main.yml/badge.svg)

## About

Asynchronous state management in React made simple.

## Features

-   CJS + ESM ✅
-   Lightweight ✅
-   Simple and easy to use ✅
-   Retry mechanism ✅
-   Caching (with support for async caches) ✅
-   Automatic garbage collection ✅
-   Remember page scroll ✅
-   Distributed transactions (with [txn](https://www.npmjs.com/package/@b.s/txn)) ✅
-   Structural sharing ✅
-   Subscriptions ✅
-   Polling ✅
-   Sync updates between tabs with [Broadcast Channel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) ✅
-   Determine network status ✅
-   SSR support ✅

## Usage

### Client-side rendering

```typescript
const { data, dispatch } = useQwery({
	initialValue: INITIAL_VALUE,
	onChange: onChangeData,
});

// or

const { data, dispatch } = useQwery({
	initialValue: () => fetch(API),
	onChange: onChangeData,
});

// or

const { data, dispatch } = useQwery({
	queryKey: "test-data", // Anything with a `toString` method is supported
	onChange: onChangeData,
});
```

To opt into caching, render your component within `QweryProvider`.

To set cached data ahead of time (prefetching):

```typescript
const qweryContext = React.useContext(QweryContext);

qweryContext.setCachedValue(queryKey)(prefetchedData);
```

To invalidate cached data:

```typescript
const qweryContext = React.useContext(QweryContext);

qweryContext.makeInvalidateCachedValue(queryKey)(prefetchedData);
```

To use subscriptions:

```typescript
// Assuming its an array of records
const subscribe = async dispatch => {
	const generator = createAsyncGenerator();

	for await (const nextValue of subscription) {
		dispatch(previousValue => {
			previousValue.push(nextValue);
		});
	}
};

const { data, dispatch } = useQwery({
	initialValue: () => fetch(API),
	onChange: onChangeData,
	subscribe: subscribe,
});
```

In a similar vein, for polling:

```typescript
// Assuming its an array of records
const subscribe = dispatch => {
	const poll = setInterval(async () => {
		const result = await fetch(API);

		// Determine the changes and dispatch only the changes
		// for references to remain stable if it is an array of records
		dispatch(result);
	}, 5000);

	return () => clearInterval(poll);
};

const { data, dispatch } = useQwery({
	initialValue: () => fetch(API),
	onChange: onChangeData,
	subscribe: subscribe,
});
```

### Server-side rendering

```typescript
const { data, dispatch } = useQwery({
	initialValue: INITIAL_VALUE, // Must be provided otherwise `data` is `undefined`
	onChange: onChangeData,
});
```

More information in:

-   `src/e2e`

## Contributions

-   Contributions are welcome, just make a pull request

**_"Man's duality, life and its formalities"_**
