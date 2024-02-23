![Tests](https://github.com/nmathew98/qwery/actions/workflows/main.yml/badge.svg)

## About

Asynchronous state management in React made simple.

## Features

-   CJS + ESM ✅
-   Lightweight ✅
-   Simple and easy to use ✅
-   Retry mechanism ✅
-   Caching (with support for async caches) ✅
-   Remember page scroll ✅
-   Distributed transactions (with [txn](https://www.npmjs.com/package/@b.s/txn)) ✅
-   Structural sharing ✅
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
