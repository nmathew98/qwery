import { createStorage, prefixStorage } from "unstorage";

interface Thread {
	createdBy: string;
	uuid: string;
	parent?: string;
	content: string;
	likes: number;
	children?: Thread[] | null;
}

interface ThreadMeta {
	children?: string[];
}

const STORAGE = createStorage();
const THREADS = prefixStorage(STORAGE, "threads");

export const getThread = async (uuid: string): Promise<Thread | null> => {
	const parent = await THREADS.getItem<Thread>(uuid);

	if (!parent) {
		return null;
	}

	const meta = (await THREADS.getMeta(uuid)) as ThreadMeta;

	return {
		...parent,
		children: !meta.children
			? null
			: ((await Promise.all(meta.children.map(getThread))) as Thread[]),
	};
};

export const upsertThread = async (
	thread: Omit<Thread, "uuid" | "children"> & Partial<Pick<Thread, "uuid">>,
): Promise<Omit<Thread, "children">> => {
	const uuid = thread.uuid ?? Math.random().toString(36).substring(2);

	if (thread.parent) {
		const meta = (await THREADS.getMeta(thread.parent)) as ThreadMeta;

		await THREADS.setMeta(thread.parent, {
			...meta,
			children: [...(meta.children ?? []), uuid],
		});
	}

	const next: Thread = {
		uuid,
		...thread,
	};

	await THREADS.setItem<Thread>(uuid, next);

	return next;
};
