import React, { ChangeEventHandler, KeyboardEventHandler } from "react";
import {
	Card,
	CardDescription,
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
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

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

const ThreadChild = ({ child, onClick, depth = 0 }) => {
	const rerenders = React.useRef(0);

	React.useLayoutEffect(() => {
		rerenders.current = rerenders.current + 1;
	}, [child]);

	return (
		<AccordionItem
			style={{ marginLeft: `${depth * 0.5}rem` }}
			value={child.uuid}
			onClick={onClick(child)}>
			<AccordionTrigger className="text-left">
				{child.content}
			</AccordionTrigger>
			<AccordionContent className="flex justify-between">
				<div className="flex-col">
					<div className="flex justify-between">
						<span>
							<span className="text-sm">
								Created at&nbsp;
								{child.createdAt.toDateString()}
								&nbsp; by {child.createdBy}
							</span>
						</span>
						<span>
							<span className="text-sm">{child.likes} 👍</span>
						</span>
					</div>
					{child.children && (
						<Accordion type="multiple">
							{child.children.map(child => (
								<ThreadChild
									key={child.uuid}
									depth={depth + 1}
									child={child}
									onClick={onClick}
								/>
							))}
						</Accordion>
					)}
				</div>
			</AccordionContent>
		</AccordionItem>
	);
};

const Thread = ({ thread }) => {
	const [replyTo, setReplyTo] = React.useState<any>(null);
	const [newThread, setNewThread] = React.useState("");
	const rerenders = React.useRef(0);

	React.useLayoutEffect(() => {
		rerenders.current = rerenders.current + 1;
	}, [thread]);

	const onChangeNewThread: ChangeEventHandler<HTMLInputElement> = event =>
		setNewThread(event.target.value);
	const onSubmitNewThead = () => {
		setNewThread("");
	};
	const onKeyDownEnterNewThread: KeyboardEventHandler<
		HTMLInputElement
	> = event => {
		if (event.key === "Enter") {
			return onSubmitNewThead();
		}

		if (event.key === "Backspace" && !newThread) {
			setReplyTo(null);
		}
	};
	const makeOnClickChildThread = child => (event: MouseEvent) => {
		event.stopPropagation();

		setReplyTo(child);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Card className="cursor-pointer max-w-lg">
					<CardHeader>
						<CardTitle>{thread.content}</CardTitle>
						<CardDescription className="flex justify-between">
							<span>
								<span className="text-sm">
									Created at {thread.createdAt.toDateString()}{" "}
									by {thread.createdBy}
								</span>
							</span>
							<span>
								<span className="text-sm">
									{thread.likes} 👍
								</span>
							</span>
						</CardDescription>
					</CardHeader>
				</Card>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader id="test">
					<DialogTitle>View whole thread</DialogTitle>
					<DialogDescription>{thread.content}</DialogDescription>
					<div className="my-4 flex-col space-y-4">
						{thread.children && (
							<div className="max-h-[50dvh] overflow-scroll">
								<Accordion
									type="multiple"
									className="flex-col space-y-8">
									{thread.children.map(child => (
										<ThreadChild
											key={child.uuid}
											child={child}
											onClick={makeOnClickChildThread}
										/>
									))}
								</Accordion>
							</div>
						)}
						<Input
							value={newThread}
							onChange={onChangeNewThread}
							onKeyDown={onKeyDownEnterNewThread}
							placeholder={
								replyTo
									? `Reply to ${replyTo.createdBy}`
									: "Share a thought...?"
							}
							type="text"
						/>
					</div>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={onSubmitNewThead} type="submit">
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const App = () => {
	return (
		<div className="flex justify-center my-8">
			<div className="flex-col space-y-8">
				{THREADS.map(thread => (
					<Thread key={thread.uuid} thread={thread} />
				))}
			</div>
		</div>
	);
};
