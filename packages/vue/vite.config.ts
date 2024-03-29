import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		dts({
			rollupTypes: true,
			logLevel: "info",
			bundledPackages: ["@b.s/qwery-shared"],
		}),
	],
	build: {
		lib: {
			entry: resolve("src", "index.ts"),
			name: "Vue Qwery",
		},
		minify: false,
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ["vue", "@b.s/incremental", "@b.s/txn"],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					vue: "Vue",
					"@b.s/incremental": "incremental",
					"@b.s/txn": "txn",
				},
			},
		},
		emptyOutDir: true,
	},
});
