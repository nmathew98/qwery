import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
	plugins: [
		solid(),
		dts({
			rollupTypes: true,
			logLevel: "info",
			bundledPackages: ["@b.s/qwery-shared"],
		}),
	],
	build: {
		lib: {
			entry: resolve("src", "index.ts"),
			name: "Solid Qwery",
		},
		minify: false,
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ["@b.s/incremental", "@b.s/txn", "solid-js"],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					"solid-js": "solid-js",
					"@b.s/incremental": "incremental",
					"@b.s/txn": "txn",
				},
			},
		},
	},
});
