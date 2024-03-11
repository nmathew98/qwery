import { onMounted, onUnmounted } from "vue";
import { isBrowser } from "@b.s/qwery-shared";

export const useRememberScroll = () => {
	if (isBrowser()) {
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

	onMounted(() => {
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

		window.addEventListener("scroll", onScroll);
	});

	onUnmounted(() => {
		window.removeEventListener("scroll", onScroll);
	});
};
