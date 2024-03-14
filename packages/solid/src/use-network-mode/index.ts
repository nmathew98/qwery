import { createSignal, onCleanup, onMount } from "solid-js";
import { NetworkMode, type UseNetworkModeOptions } from "@b.s/qwery-shared";
export { NetworkMode } from "@b.s/qwery-shared";

export const useNetworkMode = (
	{
		ping = "https://captive.apple.com/hotspot-detect.html",
	}: UseNetworkModeOptions = Object.create(null),
) => {
	const [isConnected, setIsConnected] = createSignal(true);
	const isOnline = () => setIsConnected(true);
	const isOffline = () => setIsConnected(false);

	fetch(ping).then(isOnline).catch(isOffline);

	onMount(() => {
		window.addEventListener("online", isOnline);
		window.addEventListener("offline", isOffline);
	});

	onCleanup(() => {
		window.removeEventListener("online", isOnline);
		window.removeEventListener("offline", isOffline);
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
