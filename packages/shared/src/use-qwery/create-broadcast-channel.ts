import type { Serializable } from "@b.s/incremental";

export const createBroadcastChannel = (channel?: Serializable) => {
	if (!channel) {
		return null;
	}

	return new BroadcastChannel(channel.toString());
};
