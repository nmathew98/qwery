import React from "react";
import { NetworkMode, type UseNetworkModeOptions } from "@b.s/qwery-shared";
export { NetworkMode } from "@b.s/qwery-shared";

export const useNetworkMode = (
	{
		ping = "https://captive.apple.com/hotspot-detect.html",
	}: UseNetworkModeOptions = Object.create(null),
) => {
	const [isConnected, setIsConnected] = React.useState(true);
	const isOnline = () => setIsConnected(true);
	const isOffline = () => setIsConnected(false);

	fetch(ping).then(isOnline).catch(isOffline);

	React.useEffect(() => {
		const onOnline = () => setIsConnected(true);
		const onOffline = () => setIsConnected(false);

		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);

		return () => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
		};
	}, []);

	return {
		connectionStatus: isConnected
			? NetworkMode.Online
			: NetworkMode.Offline,
		isOnline,
		isOffline,
	};
};
