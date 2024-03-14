import { NetworkMode, type UseNetworkModeOptions } from "@b.s/qwery-shared";
import { beforeUpdate, onDestroy, onMount } from "svelte";
import { derived, writable } from "svelte/store";

export const useNetworkMode = (
	{
		ping = "https://captive.apple.com/hotspot-detect.html",
	}: UseNetworkModeOptions = Object.create(null),
) => {
	const isConnected = writable(true);

	const isOnline = () => isConnected.set(true);
	const isOffline = () => isConnected.set(false);

	fetch(ping).then(isOnline).catch(isOffline);

	onMount(() => {
		window.addEventListener("online", isOnline);
		window.addEventListener("offline", isOffline);
	});

	beforeUpdate(() => {
		fetch(ping).then(isOnline).catch(isOffline);
	});

	onDestroy(() => {
		window.removeEventListener("online", isOnline);
		window.removeEventListener("offline", isOffline);
	});

	return {
		connectionStatus: derived(isConnected, $isConnected =>
			$isConnected ? NetworkMode.Online : NetworkMode.Offline,
		),
		isOnline,
		isOffline,
	};
};
