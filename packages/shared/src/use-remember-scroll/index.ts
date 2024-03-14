export const restoreScroll = () => {
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
};

export const makeOnScroll = () => {
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

	return onScroll;
};
