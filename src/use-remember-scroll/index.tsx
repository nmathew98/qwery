import { useEffect } from "react";
import {
	ExecutionEnvironment,
	useExecutionEnvironment,
} from "../use-execution-environment";

export const useRememberScroll = () => {
	const { executionEnvironment } = useExecutionEnvironment();

	useEffect(() => {
		const onScroll = () => {
			const currentPath = window.location.pathname;

			sessionStorage.setItem(
				currentPath,
				JSON.stringify({
					scrollX: window.scrollX,
					scrollY: window.scrollY,
				}),
			);
		};

		const currentPath = window.location.pathname;

		const savedScroll = sessionStorage.getItem(currentPath)
			? JSON.parse(sessionStorage.getItem(currentPath) as string)
			: null;

		if (!savedScroll) {
			return;
		}

		window.scrollTo({
			left: savedScroll.scrollX,
			top: savedScroll.scrollY,
		});

		if (executionEnvironment === ExecutionEnvironment.Browser) {
			window.addEventListener("scroll", onScroll);
		}

		return () => {
			window.removeEventListener("scroll", onScroll);
		};
	}, []);
};
