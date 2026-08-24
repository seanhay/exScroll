import type { Axis } from "./types"

/**
 * Everything that differs between a horizontal and a vertical scrollbar, so the
 * instance logic itself can stay axis-agnostic.
 */
export interface AxisAdapter {
	readonly axis: Axis
	readonly orientation: "horizontal" | "vertical"
	readonly sizeProp: "width" | "height"
	readonly crossSizeProp: "width" | "height"
	clientSize(el: HTMLElement): number
	scrollSize(el: HTMLElement): number
	getScroll(el: HTMLElement): number
	setScroll(el: HTMLElement, value: number): void
	coord(event: { clientX: number; clientY: number }): number
	rectStart(rect: DOMRect): number
	translate(offset: number): string
	isDecreaseKey(key: string): boolean
	isIncreaseKey(key: string): boolean
}

const horizontal: AxisAdapter = {
	axis: "x",
	orientation: "horizontal",
	sizeProp: "width",
	crossSizeProp: "height",
	clientSize: (el) => el.clientWidth,
	scrollSize: (el) => el.scrollWidth,
	getScroll: (el) => el.scrollLeft,
	setScroll: (el, value) => {
		el.scrollLeft = value
	},
	coord: (event) => event.clientX,
	rectStart: (rect) => rect.left,
	translate: (offset) => `translateX(${offset}px)`,
	isDecreaseKey: (key) => key === "ArrowLeft",
	isIncreaseKey: (key) => key === "ArrowRight",
}

const vertical: AxisAdapter = {
	axis: "y",
	orientation: "vertical",
	sizeProp: "height",
	crossSizeProp: "width",
	clientSize: (el) => el.clientHeight,
	scrollSize: (el) => el.scrollHeight,
	getScroll: (el) => el.scrollTop,
	setScroll: (el, value) => {
		el.scrollTop = value
	},
	coord: (event) => event.clientY,
	rectStart: (rect) => rect.top,
	translate: (offset) => `translateY(${offset}px)`,
	isDecreaseKey: (key) => key === "ArrowUp",
	isIncreaseKey: (key) => key === "ArrowDown",
}

export function getAdapter(axis: Axis): AxisAdapter {
	return axis === "y" ? vertical : horizontal
}

/**
 * Picks the axis that actually overflows. Ties and "neither overflows yet"
 * both resolve to x, which keeps v1's behaviour for content that hasn't
 * loaded or sized itself at init time.
 */
export function detectAxis(content: HTMLElement): Axis {
	const overflowX = content.scrollWidth - content.clientWidth
	const overflowY = content.scrollHeight - content.clientHeight
	return overflowY > overflowX ? "y" : "x"
}
