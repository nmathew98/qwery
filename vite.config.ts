import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), dts({ rollupTypes: true })],
	build: {
		lib: {
			entry: resolve("src", "index.ts"),
			name: "React Qwery",
		},
		emptyOutDir: true,
	},
});
