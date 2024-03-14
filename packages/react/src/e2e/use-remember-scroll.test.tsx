import { describe, it, expect, vitest, afterEach } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useRememberScroll } from "../use-remember-scroll";

describe("useRememberScroll", () => {
	afterEach(cleanup);

	it("remembers the page scroll location", () => {
		global.sessionStorage = createMockSessionStorage();
		const getItemSpy = vitest.spyOn(global.sessionStorage, "getItem");
		const setItemSpy = vitest.spyOn(global.sessionStorage, "setItem");

		const App = () => {
			useRememberScroll();

			return <></>;
		};

		render(<App />);

		expect(sessionStorage).toHaveLength(0);

		fireEvent.scroll(window, {
			scrollX: 100,
			screenY: 100,
		});

		expect(sessionStorage.length).toBe(1);

		render(<App />);

		expect(getItemSpy).toBeCalledTimes(2);
		expect(setItemSpy).toBeCalledTimes(1);
	});
});

const createMockSessionStorage = (): Window["sessionStorage"] => ({
	__length__: 0,
	get length() {
		return this.__length__;
	},
	clear: vitest.fn(),
	getItem: vitest.fn(),
	setItem() {
		this.__length__++;
	},
	key: vitest.fn(),
	removeItem() {
		this.__length__--;
	},
});
