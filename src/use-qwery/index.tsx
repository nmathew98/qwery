import React from "react";
import { createCRDT } from "@b.s/incremental";
import { QweryContext } from "..";

export const useQwery = ({
	queryKey,
	initalValue,
	onChange,
	onSuccess,
	onError,
	subscribe,
	debug = false,
}: any) => {
	const [renderCount, setRenderCount] = React.useState(0);
	const context = React.useContext(QweryContext);
	// TODO: Update to `CRDT`
	const crdtRef = React.useRef<null | ReturnType<typeof createCRDT>>(null);

	const proxiedOnSuccess = new Proxy(onSuccess, {
		apply: (onSuccess, thisArg, args) => {
			Reflect.apply(onSuccess, thisArg, args);

			if (queryKey) {
				context?.makeOnChange?.(queryKey).apply(null, [args[0]]);
			}

			setRenderCount(renderCount => renderCount + 1);
		},
	});

	React.useEffect(() => {
		const computeInitialValue = async () => {
			const cachedValue = queryKey
				? context?.getCachedValue?.(queryKey)
				: null;

			return await (cachedValue ?? initalValue);
		};

		const initializeCRDT = async () => {
			const initialValue = await computeInitialValue();

			const crdt = createCRDT({
				initialValue,
				onChange: onChange,
				onSuccess: proxiedOnSuccess,
				onError: onError,
				trackVersions: debug,
			});

			crdtRef.current = crdt;

			/// @ts-expect-error
			subscribe().then(result =>
				crdt.dispatch(result, {
					onChange: () =>
						setRenderCount(renderCount => renderCount + 1),
				}),
			);
		};

		initializeCRDT();
	}, []);

	React.useDebugValue(crdtRef.current?.versions, versions =>
		JSON.stringify(
			{
				renderCount,
				versions: versions ?? [],
			},
			null,
			2,
		),
	);

	return {
		data: crdtRef.current?.data,
		dispatch: crdtRef.current?.dispatch ?? noOpFunction,
		versions: crdtRef.current?.versions ?? [],
	};
};

const noOpFunction = () => {};
