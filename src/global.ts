import { exScroll } from "./index"

declare global {
	interface Window {
		exScroll: typeof exScroll
	}
}

if (typeof window !== "undefined") {
	window.exScroll = exScroll
}

export {}
