import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "happy-dom",
		include: ["test/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/global.ts"],
		},
	},
})
