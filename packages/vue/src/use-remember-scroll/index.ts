import { onMounted, onUnmounted } from "vue";
import { isBrowser, makeOnScroll, restoreScroll } from "@b.s/qwery-shared";

export const useRememberScroll = () => {
	if (!isBrowser()) {
		return;
	}

	const onScroll = makeOnScroll();

	onMounted(() => {
		restoreScroll();

		window.addEventListener("scroll", onScroll);
	});

	onUnmounted(() => {
		window.removeEventListener("scroll", onScroll);
	});
};
