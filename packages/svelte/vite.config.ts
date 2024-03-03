import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "vite-plugin-dts";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		dts({
			rollupTypes: true,
			logLevel: "info",
			bundledPackages: ["@b.s/qwery-shared"],
		}),
	],
	build: {
		lib: {
			entry: resolve("src", "index.ts"),
			name: "Svelte Qwery",
		},
		minify: false,
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ["@b.s/incremental", "@b.s/txn"],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					"@b.s/incremental": "incremental",
					"@b.s/txn": "txn",
				},
			},
		},
	},
});
