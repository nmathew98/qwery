import { onMount, onDestroy } from "svelte";
import { isBrowser, makeOnScroll, restoreScroll } from "@b.s/qwery-shared";

export const useRememberScroll = () => {
	if (!isBrowser()) {
		return;
	}

	const onScroll = makeOnScroll();

	onMount(() => {
		restoreScroll();

		window.addEventListener("scroll", onScroll);
	});

	onDestroy(() => {
		window.removeEventListener("scroll", onScroll);
	});
};
