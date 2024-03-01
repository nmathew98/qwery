import React from "react";

export enum NetworkMode {
	Offline = 0,
	Online,
}

export const useNetworkMode = ({
	ping = "https://captive.apple.com/hotspot-detect.html",
}) => {
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
