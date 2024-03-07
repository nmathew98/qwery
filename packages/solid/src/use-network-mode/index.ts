import { createSignal, onCleanup, onMount } from "solid-js";
import { NetworkMode, type UseNetworkModeOptions } from "@b.s/qwery-shared";
export { NetworkMode } from "@b.s/qwery-shared";

export const useNetworkMode = ({
	ping = "https://captive.apple.com/hotspot-detect.html",
}: UseNetworkModeOptions) => {
	const [isConnected, setIsConnected] = createSignal(true);
	const isOnline = () => setIsConnected(true);
	const isOffline = () => setIsConnected(false);

	fetch(ping).then(isOnline).catch(isOffline);

	onMount(() => {
		const onOnline = () => setIsConnected(true);
		const onOffline = () => setIsConnected(false);

		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);

		return onCleanup(() => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
		});
	});

	return {
		connectionStatus: () => {
			fetch(ping).then(isOnline).catch(isOffline);

			return isConnected() ? NetworkMode.Online : NetworkMode.Offline;
		},
		isOnline,
		isOffline,
	};
};
