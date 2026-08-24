import { defineConfig } from "tsup"

// `clean` is handled by scripts/clean.mjs before tsup runs: with two configs in
// one process, a per-config clean can race and wipe the other's output.
export default defineConfig([
	{
		entry: { exscroll: "src/index.ts" },
		format: ["esm"],
		dts: true,
		clean: false,
		treeshake: true,
		target: "es2022",
		sourcemap: true,
	},
	{
		// Standalone browser build: defines a global `exScroll` for <script src>.
		// Emitted as dist/exscroll.global.js by the iife format suffix.
		entry: { exscroll: "src/global.ts" },
		format: ["iife"],
		dts: false,
		clean: false,
		minify: true,
		treeshake: true,
		target: "es2022",
		sourcemap: true,
	},
])
