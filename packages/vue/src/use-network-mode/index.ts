import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";

export enum NetworkMode {
	Offline = 0,
	Online,
}

export const useNetworkMode = ({
	ping = "https://captive.apple.com/hotspot-detect.html",
}) => {
	const isConnected = ref(true);

	const isOnline = () => {
		isConnected.value = true;
	};

	const isOffline = () => {
		isConnected.value = false;
	};

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
