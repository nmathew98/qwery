export const H1 = ({ children }) => (
	<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		{children}
	</h1>
);

export const P = ({ children }) => (
	<p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
);
