import React, { ChangeEventHandler, KeyboardEventHandler } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { faker } from "@faker-js/faker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { ThemeProvider } from "./components/theme-provider";
import { H1, P } from "./components/ui/typography";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { Textarea } from "./components/ui/textarea";
import {
	type Thread,
	getAllThreads,
	upsertThread,
} from "@b.s/qwery-example-api";
import { useQwery } from "@b.s/react-qwery";

const ThreadChild = ({ child, onClickReply, onClickExpand }) => {
	const previous = React.useRef(child);
	const rerenders = React.useRef(0);

	React.useLayoutEffect(() => {
		if (previous.current !== child) {
			rerenders.current = rerenders.current + 1 * 50;
			previous.current = child;
		}
	}, [child]);

	return (
		<Card
			className="cursor-pointer border-2"
			style={{
				borderColor: `hsl(${Math.max(250 - rerenders.current, 0)}, 100%, 50%)`,
			}}>
			<CardHeader>
				<CardTitle>{child.createdBy}</CardTitle>
				<CardDescription className="flex space-x-1">
					<span>{child.createdAt.toDateString()}</span>
					<span>&middot;</span>
					<span className="inline-flex items-center space-x-1">
						<span>{child.likes}</span>
						<span>
							<StarFilledIcon />
						</span>
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent>
				<P>{child.content}</P>
			</CardContent>
			<CardFooter className="flex-col space-y-4">
				{child.children && (
					<Button
						className="w-full"
						variant="secondary"
						onClick={onClickExpand(child)}>
						View whole thread
					</Button>
				)}
				<Button
					variant="default"
					className="w-full"
					onClick={onClickReply(child)}>
					Reply
				</Button>
			</CardFooter>
		</Card>
	);
};

const Thread = ({ initialValue, dispatch: landingDispatch }) => {
	const name = React.useRef(faker.person.fullName());
	const [currentThread, setCurrentThread] = React.useState(initialValue);
	const [replyTo, setReplyTo] = React.useState<any>(null);
	const [content, setContent] = React.useState("");

	const previous = React.useRef(initialValue);
	const rerenders = React.useRef(0);

	const { data, dispatch } = useQwery({
		queryKey: `threads-${initialValue.uuid}`,
		initialValue: initialValue as Thread,
		onChange: async (next: Thread) => {
			const newItem = next.children?.find(thread => !thread.uuid);

			if (!newItem) {
				throw new Error("Unexpected error: New thread not found");
			}

			const result = await upsertThread(newItem);

			return result;
		},
		onSuccess: (next: Thread, _previous: Thread, result) =>
			({
				...next,
				children: next.children!.map(child => {
					if (!child.uuid) {
						return {
							...child,
							...(result as Omit<Thread, "children">),
						};
					}

					return child;
				}),
			}) as Thread,
	});

	React.useLayoutEffect(() => {
		if (previous.current !== currentThread) {
			rerenders.current = rerenders.current + 1 * 50;
			previous.current = currentThread;
		}
	}, [currentThread]);

	const onChangeNewThread: ChangeEventHandler<HTMLInputElement> = event =>
		setContent(event.target.value);
	const onSubmitNewThread = async () => {
		// This is a really deep update so manually create the new `Thread`
		// we are creating a child thread for a child thread
		// and then dispatch the update specifying it has already been persisted
		if (replyTo) {
			const findDeep = (uuid: string, thread: Thread) => {
				if (thread.uuid === uuid) {
					return thread;
				}

				if (!thread.children) {
					return null;
				}

				for (let i = 0; i < thread.children.length; i++) {
					const result = findDeep(uuid, thread.children[i]);

					if (result) {
						return result;
					}
				}
			};

			const newThread = {
				createdBy: name.current,
				content: content,
				parent: replyTo.uuid,
				likes: 0,
			};

			const result = await upsertThread(newThread);

			// `dispatch` returns the `latest` version of the main thread here
			// since the global `onChange` which is async is not triggered
			const latest = dispatch(
				thread => {
					const replyingTo = findDeep(replyTo.uuid, thread);

					replyingTo.children ??= [];
					replyingTo.children.unshift(result);
				},
				{ isPersisted: true },
			) as Thread;

			landingDispatch(
				allThreads => {
					const currentThread = allThreads.find(
						thread => thread.uuid === latest.uuid,
					);

					currentThread.children = latest.children;
				},
				{ isPersisted: true },
			);

			setCurrentThread(findDeep(currentThread.uuid, latest));

			return setContent("");
		}

		const newThread = {
			createdBy: name.current,
			content: content,
			parent: currentThread.uuid,
			likes: 0,
		};

		// `dispatch` returns a `Promise` here since the global `onChange` is triggered
		const latest = (await dispatch(thread => {
			thread.children ??= [];

			thread.children.unshift(newThread as Thread);
		})) as Thread;

		setContent("");
		return setCurrentThread(latest);
	};
	const replyToMainThread = () => setReplyTo(null);
	const onKeyDownNewThread: KeyboardEventHandler<
		HTMLInputElement
	> = event => {
		if (event.key === "Enter") {
			return onSubmitNewThread();
		}

		if (event.key === "Backspace" && !setContent) {
			replyToMainThread();
		}
	};
	const makeOnClickReply = child => (event: MouseEvent) => {
		event.stopPropagation();

		setReplyTo(child);
	};
	const makeOnClickExpandThread = child => () => {
		setCurrentThread(child);
	};
	const onClickReturnToMainThread = () => {
		setCurrentThread(data);
		setReplyTo(null);
	};

	if (!data) {
		return null;
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Card
					className="cursor-pointer max-w-2xl border-2"
					style={{
						borderColor: `hsl(${Math.max(250 - rerenders.current, 0)}, 100%, 50%)`,
					}}>
					<CardHeader>
						<CardTitle>{data.createdBy}</CardTitle>
						<CardDescription className="flex space-x-1">
							<span>{data.createdAt.toDateString()}</span>
							<span>&middot;</span>
							<span className="inline-flex items-center space-x-1">
								<span>{data.likes}</span>
								<span>
									<StarFilledIcon />
								</span>
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<P>{data.content}</P>
					</CardContent>
					<CardFooter>
						<Button className="w-full">View whole thread</Button>
					</CardFooter>
				</Card>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>View whole thread</DialogTitle>
					<DialogDescription>
						{currentThread.content}
					</DialogDescription>
				</DialogHeader>
				{currentThread.children && (
					<div className="max-h-[50dvh] overflow-scroll flex-col space-y-8">
						{currentThread.children.map(child => (
							<ThreadChild
								key={child.uuid}
								child={child}
								onClickExpand={makeOnClickExpandThread}
								onClickReply={makeOnClickReply}
							/>
						))}
					</div>
				)}
				<div className="flex-col space-y-2">
					<Input
						value={content}
						onChange={onChangeNewThread}
						onKeyDown={onKeyDownNewThread}
						placeholder={
							replyTo
								? `Reply to ${replyTo.createdBy}`
								: "Share a thought...?"
						}
						type="text"
					/>
					{replyTo !== null && (
						<Button
							variant="ghost"
							size="sm"
							onClick={replyToMainThread}>
							Reply to main thread
						</Button>
					)}
				</div>
				<DialogFooter>
					{currentThread.uuid !== initialValue.uuid && (
						<Button
							onClick={onClickReturnToMainThread}
							variant="secondary"
							type="reset">
							View main thread
						</Button>
					)}
					<Button
						disabled={!content}
						onClick={onSubmitNewThread}
						type="submit">
						Submit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const NewThread = ({ dispatch }) => {
	const name = React.useRef(faker.person.fullName());
	const [content, setContent] = React.useState("");

	const onChangeNewThread: ChangeEventHandler<HTMLTextAreaElement> = event =>
		setContent(event.target.value);
	const onSubmitNewThread = () => {
		const newThread = {
			createdBy: name.current,
			content: content,
			likes: 0,
		};

		// Dispatch and create a new `Thread`
		dispatch(allThreads => void allThreads.unshift(newThread));

		setContent("");
	};
	const onKeyDownNewThread: KeyboardEventHandler<
		HTMLTextAreaElement
	> = event => {
		if (event.key === "Enter") {
			event.preventDefault();
			return onSubmitNewThread();
		}
	};

	return (
		<Card className="cursor-pointer max-w-2xl border-2">
			<CardHeader>
				<CardTitle>{name.current}</CardTitle>
			</CardHeader>
			<CardContent>
				<Textarea
					value={content}
					onChange={onChangeNewThread}
					onKeyDown={onKeyDownNewThread}
					placeholder="Share a thought...?"
				/>
			</CardContent>
			<CardFooter>
				<Button
					onClick={onSubmitNewThread}
					disabled={!content}
					className="w-full">
					Submit
				</Button>
			</CardFooter>
		</Card>
	);
};

export const App = () => {
	// We have many main `Thread`s and each `Thread` can have zero or more
	// child `Thread`s
	const { data, dispatch } = useQwery({
		queryKey: "threads",
		initialValue: getAllThreads, // Get all main threads
		onChange: async next => {
			const newItemIdx = next.findIndex(thread => !thread.uuid);

			const result = await upsertThread(next[newItemIdx]);

			return result;
		},
		onSuccess: (next, _previous, result) =>
			next.map(thread => {
				if (!thread.uuid) {
					return {
						...thread,
						...result,
					};
				}

				return thread;
			}),
	});

	const allThreads = data?.sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	);

	if (!data) {
		return null;
	}

	return (
		<ThemeProvider defaultTheme="dark">
			<div className="flex justify-center my-8 mx-4 sm:mx-0">
				<div className="flex-col space-y-8">
					<H1>My Feed</H1>
					<NewThread dispatch={dispatch} />
					{allThreads?.map(thread => (
						<Thread
							key={thread.uuid}
							initialValue={thread}
							dispatch={dispatch}
						/>
					))}
				</div>
			</div>
		</ThemeProvider>
	);
};
