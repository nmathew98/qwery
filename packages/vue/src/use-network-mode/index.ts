import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";
import { NetworkMode, type UseNetworkModeOptions } from "@b.s/qwery-shared";

export { NetworkMode, type UseNetworkModeOptions } from "@b.s/qwery-shared";

export const useNetworkMode = (
	{
		ping = "https://captive.apple.com/hotspot-detect.html",
	}: UseNetworkModeOptions = Object.create(null),
) => {
	const isConnected = ref(true);

	const isOnline = () => {
		isConnected.value = true;
	};

	const isOffline = () => {
		isConnected.value = false;
	};

	fetch(ping).then(isOnline).catch(isOffline);

	onMounted(() => {
		window.addEventListener("online", isOnline);
		window.addEventListener("offline", isOffline);
	});

	onUpdated(() => {
		fetch(ping).then(isOnline).catch(isOffline);
	});

	onUnmounted(() => {
		window.removeEventListener("online", isOnline);
		window.removeEventListener("offline", isOffline);
	});

	return {
		connectionStatus: computed(() =>
			isConnected.value ? NetworkMode.Online : NetworkMode.Offline,
		),
		isOnline,
		isOffline,
	};
};
