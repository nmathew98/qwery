import { onMount, onDestroy } from "svelte";
import { ExecutionEnvironment } from "@b.s/qwery-shared";
import { useExecutionEnvironment } from "../use-execution-environment";

export const useRememberScroll = () => {
	const { executionEnvironment } = useExecutionEnvironment();

	if (executionEnvironment !== ExecutionEnvironment.Browser) {
		return;
	}

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

	onMount(() => {
		const currentPath = window.location.pathname;

		const savedScroll = sessionStorage.getItem(currentPath)
			? JSON.parse(sessionStorage.getItem(currentPath) as string)
			: null;

		if (savedScroll) {
			window.scrollTo({
				left: savedScroll.scrollX,
				top: savedScroll.scrollY,
			});
		}

		window.addEventListener("scroll", onScroll);
	});

	onDestroy(() => {
		window.removeEventListener("scroll", onScroll);
	});
};
