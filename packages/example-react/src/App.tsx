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

const createThread = (
	parent?: string,
	depth: number = faker.number.int({ min: 0, max: 3 }),
) => {
	const uuid = faker.string.uuid();

	return {
		createdBy: faker.person.fullName(),
		createdAt: faker.date.anytime(),
		uuid,
		parent,
		content: faker.lorem.lines(),
		likes: faker.number.int({ min: 0, max: 100 }),
		children:
			depth > 0
				? new Array(faker.number.int({ min: 5, max: 10 }))
						.fill(() => null)
						.map(() => createThread(uuid, depth - 1))
				: null,
	};
};
const THREADS = faker.helpers.multiple(() => createThread(), {
	count: {
		min: 5,
		max: 10,
	},
});

const ThreadChild = ({ child, onClickReply, onClickExpand }) => {
	const rerenders = React.useRef(0);

	React.useLayoutEffect(() => {
		rerenders.current = rerenders.current + 1;
	}, [child]);

	return (
		<Card
			className="cursor-pointer border-2"
			style={{
				borderColor: `hsl(${250 - rerenders.current}, 100%, 50%)`,
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

const Thread = ({ thread }) => {
	const [currentThread, setCurrentThread] = React.useState(thread);
	const [replyTo, setReplyTo] = React.useState<any>(null);
	const [newThread, setNewThread] = React.useState("");
	const rerenders = React.useRef(0);

	React.useLayoutEffect(() => {
		rerenders.current = rerenders.current + 1;
	}, [thread]);

	const onChangeNewThread: ChangeEventHandler<HTMLInputElement> = event =>
		setNewThread(event.target.value);
	const onSubmitNewThread = () => {
		setNewThread("");
	};
	const replyToMainThread = () => setReplyTo(null);
	const onKeyDownNewThread: KeyboardEventHandler<
		HTMLInputElement
	> = event => {
		if (event.key === "Enter") {
			return onSubmitNewThread();
		}

		if (event.key === "Backspace" && !newThread) {
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
		setCurrentThread(thread);
		setReplyTo(null);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Card
					className="cursor-pointer max-w-2xl border-2"
					style={{
						borderColor: `hsl(${250 - rerenders.current}, 100%, 50%)`,
					}}>
					<CardHeader>
						<CardTitle>{thread.createdBy}</CardTitle>
						<CardDescription className="flex space-x-1">
							<span>{thread.createdAt.toDateString()}</span>
							<span>&middot;</span>
							<span className="inline-flex items-center space-x-1">
								<span>{thread.likes}</span>
								<span>
									<StarFilledIcon />
								</span>
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<P>{thread.content}</P>
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
						value={newThread}
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
					{currentThread !== thread && (
						<Button
							onClick={onClickReturnToMainThread}
							variant="secondary"
							type="reset">
							View main thread
						</Button>
					)}
					<Button
						disabled={!newThread}
						onClick={onSubmitNewThread}
						type="submit">
						Submit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const NewThread = () => {
	const name = React.useRef(faker.person.fullName());
	const [newThread, setNewThread] = React.useState("");

	const onChangeNewThread: ChangeEventHandler<HTMLTextAreaElement> = event =>
		setNewThread(event.target.value);
	const onSubmitNewThread = () => {
		setNewThread("");
	};
	const onKeyDownNewThread: KeyboardEventHandler<
		HTMLTextAreaElement
	> = event => {
		if (event.key === "Enter") {
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
					value={newThread}
					onChange={onChangeNewThread}
					onKeyDown={onKeyDownNewThread}
					placeholder="Share a thought...?"
				/>
			</CardContent>
			<CardFooter>
				<Button
					onClick={onSubmitNewThread}
					disabled={!newThread}
					className="w-full">
					Submit
				</Button>
			</CardFooter>
		</Card>
	);
};

export const App = () => {
	return (
		<ThemeProvider defaultTheme="dark">
			<div className="flex justify-center my-8 mx-4 sm:mx-0">
				<div className="flex-col space-y-8">
					<H1>My Feed</H1>
					<NewThread />
					{THREADS.map(thread => (
						<Thread key={thread.uuid} thread={thread} />
					))}
				</div>
			</div>
		</ThemeProvider>
	);
};
