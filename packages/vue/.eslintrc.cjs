/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
	root: true,
	extends: [
		"plugin:vue/vue3-essential",
		"eslint:recommended",
		"@vue/eslint-config-typescript",
		"@vue/eslint-config-prettier/skip-formatting",
	],
	parserOptions: {
		ecmaVersion: "latest",
	},
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
