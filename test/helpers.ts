/**
 * happy-dom has no layout engine, so every size the plugin reads is stubbed
 * here. Keeps the DOM tests honest about which numbers actually drive things.
 */

export interface MountOptions {
	clientWidth?: number
	scrollWidth?: number
	clientHeight?: number
	scrollHeight?: number
	trackWidth?: number
	trackHeight?: number
	withContent?: boolean
	withScrollbar?: boolean
}

export interface Mounted {
	wrapper: HTMLElement
	content: HTMLElement
	scrollbar: HTMLElement
	track(): HTMLElement
	dragger(): HTMLElement
}

function stub(el: HTMLElement, prop: string, value: number): void {
	Object.defineProperty(el, prop, { configurable: true, get: () => value })
}

export function mount(options: MountOptions = {}): Mounted {
	const {
		clientWidth = 600,
		scrollWidth = 2000,
		clientHeight = 300,
		scrollHeight = 300,
		trackWidth = 600,
		trackHeight = 12,
		withContent = true,
		withScrollbar = true,
	} = options

	const wrapper = document.createElement("div")
	wrapper.setAttribute("exscroll", "")

	const content = document.createElement("div")
	if (withContent) content.setAttribute("exscroll-content", "")
	stub(content, "clientWidth", clientWidth)
	stub(content, "scrollWidth", scrollWidth)
	stub(content, "clientHeight", clientHeight)
	stub(content, "scrollHeight", scrollHeight)
	// happy-dom leaves these read-only at 0; the plugin writes to them.
	let left = 0
	let top = 0
	Object.defineProperty(content, "scrollLeft", {
		configurable: true,
		get: () => left,
		set: (v: number) => {
			left = v
		},
	})
	Object.defineProperty(content, "scrollTop", {
		configurable: true,
		get: () => top,
		set: (v: number) => {
			top = v
		},
	})
	wrapper.appendChild(content)

	const scrollbar = document.createElement("div")
	if (withScrollbar) scrollbar.setAttribute("exscroll-scrollbar", "")
	wrapper.appendChild(scrollbar)

	document.body.appendChild(wrapper)

	// The track is created by the plugin, so stub its size on first access.
	const trackOf = (): HTMLElement => {
		const track = scrollbar.querySelector(".exscroll-track") as HTMLElement
		if (track && !Object.getOwnPropertyDescriptor(track, "clientWidth")) {
			stub(track, "clientWidth", trackWidth)
			stub(track, "clientHeight", trackHeight)
		}
		return track
	}

	return {
		wrapper,
		content,
		scrollbar,
		track: trackOf,
		dragger: () => scrollbar.querySelector(".exscroll-dragger") as HTMLElement,
	}
}

export function pointer(
	type: string,
	props: Record<string, unknown> = {},
): Event {
	const event = new Event(type, { bubbles: true, cancelable: true })
	Object.assign(event, {
		pointerId: 1,
		button: 0,
		clientX: 0,
		clientY: 0,
		...props,
	})
	return event
}

export function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}
