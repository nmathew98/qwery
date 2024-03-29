![Tests](https://github.com/nmathew98/qwery/actions/workflows/main.yml/badge.svg)

## About

Asynchronous state management in React made simple.

Qwery provides the structure required to manage and build relationships between asynchronous state while taking care of stabilizing object references and keeping the cache (if any) up to date.

It also enables an environment agnostic approach to managing asynchronous state allowing simpler migrations between different frontend frameworks and backend architectural styles such as monolith to microservices and REST to GraphQL.

Size: [Bundlephobia](https://bundlephobia.com/package/@b.s/react-qwery)

Documentation: [Wiki](https://github.com/nmathew98/qwery/wiki/1.-Introduction)

Try it out: [StackBlitz](https://stackblitz.com/edit/react-qwery-threads?file=README.md)

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
-   Query cancellation ✅
-   Suspense ✅
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
	broadcast: true, // Query key must be set to enable broadcasting updates between tabs
});

// or (Suspense)

const { data, dispatch } = await useQwery({
	initialValue: () => fetch(API),
	onChange: onChangeData,
	suspense: true,
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
