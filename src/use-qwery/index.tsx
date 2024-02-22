import React from "react";
import { createCRDT } from "@b.s/incremental";
import { QweryContext } from "..";
import { useRememberScroll } from "../use-remember-scroll";

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

	const proxiedOnChange = new Proxy(onChange, {
		apply: (onChange, thisArg, args) => {
			const result = Reflect.apply(onChange, thisArg, args);

			if (!result) {
				if (queryKey) {
					context?.makeOnChange?.(queryKey).apply(null, [args[0]]);
				}

				setRenderCount(renderCount => renderCount + 1);
			}

			return result;
		},
	});

	const proxiedOnSuccess = new Proxy(onSuccess, {
		apply: (onSuccess, thisArg, args) => {
			Reflect.apply(onSuccess, thisArg, args);

			if (queryKey) {
				context?.makeOnChange?.(queryKey).apply(null, [args[0]]);
			}

			setRenderCount(renderCount => renderCount + 1);
		},
	});

	useRememberScroll();

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
				onChange: proxiedOnChange,
				onSuccess: proxiedOnSuccess,
				onError: onError,
				trackVersions: debug,
			});

			crdtRef.current = crdt;

			const proxiedDispatch = new Proxy(crdt.dispatch, {
				apply: (dispatch, thisArg, args) => {
					const subscribeOptions = {
						isPersisted: true,
					};

					const result = Reflect.apply(dispatch, thisArg, [
						args[0],
						subscribeOptions,
					]);

					return result;
				},
			});

			subscribe(proxiedDispatch);
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
