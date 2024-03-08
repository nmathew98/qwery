module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	ignorePatterns: ["dist", ".eslintrc.cjs"],
	parser: "@typescript-eslint/parser",
	plugins: ["prettier"],
	rules: {
		"prettier/prettier": ["error", { usePrettierrc: true }],
		"@typescript-eslint/no-explicit-any": 0,
		eqeqeq: ["error", "always"],
		"@typescript-eslint/no-unused-vars": [
			"error",
			{ argsIgnorePattern: "^_" },
		],
	},
};
