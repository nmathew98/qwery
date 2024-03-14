import { createStorage, prefixStorage } from "unstorage";
import { faker } from "@faker-js/faker";

export interface Thread {
	createdBy: string;
	createdAt: Date;
	uuid: string;
	parent?: string;
	content: string;
	likes: number;
	children?: Thread[] | null;
}

export interface ThreadMeta {
	children?: string[];
}

const STORAGE = createStorage();
const THREADS = prefixStorage(STORAGE, "threads");

export const getAllThreads = async (): Promise<Thread[]> => {
	await sleep(500);

	const keys = await THREADS.getKeys();

	return Promise.all(keys.map(getThread)) as Promise<Thread[]>;
};

export const getThread = async (uuid: string): Promise<Thread> => {
	const parent = await THREADS.getItem<Thread>(uuid);

	if (!parent) {
		throw new Error("Not found!!!");
	}

	const meta = (await THREADS.getMeta(uuid)) as ThreadMeta;

	return {
		...parent,
		createdAt: new Date(parent.createdAt),
		children: !meta.children
			? null
			: ((await Promise.all(meta.children.map(getThread))) as Thread[]),
	};
};

export const upsertThread = async (
	thread: Omit<Thread, "uuid" | "children" | "createdAt"> &
		Partial<Pick<Thread, "uuid">>,
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
		createdAt: new Date(),
		...thread,
	};

	await THREADS.setItem<Thread>(uuid, next);

	return next;
};

const sleep = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms));

const setup = () => {
	const createCompleteThread = (
		parent?: string,
		depth: number = faker.number.int({ min: 0, max: 3 }),
	) => {
		const uuid = faker.string.uuid();

		return {
			createdBy: faker.person.fullName(),
			createdAt: faker.date.past({
				years: 10,
				refDate: new Date("2023"),
			}),
			uuid,
			parent,
			content: faker.lorem.lines(),
			likes: faker.number.int({ min: 0, max: 100 }),
			children:
				depth > 0
					? new Array(faker.number.int({ min: 5, max: 10 }))
							.fill(() => null)
							.map(() => createCompleteThread(uuid, depth - 1))
					: null,
		};
	};

	const THREADS = faker.helpers.multiple(() => createCompleteThread(), {
		count: {
			min: 5,
			max: 10,
		},
	});

	const createThread = ({ children, ...thread }: Thread) => {
		upsertThread(thread);

		if (!children) {
			return;
		}

		children.forEach(upsertThread);
	};

	THREADS.forEach(createThread);
};

setup();
