import { onCleanup, onMount } from "solid-js";
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

	onCleanup(() => {
		window.removeEventListener("scroll", onScroll);
	});
};
