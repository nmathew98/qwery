import React from "react";
import { makeOnScroll, restoreScroll } from "@b.s/qwery-shared";

export const useRememberScroll = () => {
	React.useEffect(() => {
		restoreScroll();

		const onScroll = makeOnScroll();

		window.addEventListener("scroll", onScroll);

		return () => {
			window.removeEventListener("scroll", onScroll);
		};
	}, []);
};
