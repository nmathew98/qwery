import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		dts({
			rollupTypes: true,
			logLevel: "info",
			bundledPackages: ["@b.s/qwery-shared"],
		}),
	],
	build: {
		lib: {
			entry: resolve("src", "index.ts"),
			name: "React Qwery",
		},
		minify: false,
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ["react", "@b.s/incremental", "@b.s/txn"],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					react: "React",
					"@b.s/incremental": "incremental",
					"@b.s/txn": "txn",
				},
			},
		},
		emptyOutDir: true,
	},
});
