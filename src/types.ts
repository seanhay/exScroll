/** Which axis a scrollbar drives. */
export type Axis = "x" | "y"

export interface ExScrollOptions {
	/** Selector for the wrapper that holds the content and the scrollbar. */
	wrapperName?: string
	/** Selector for the overflowing element, resolved within each wrapper. */
	contentName?: string
	/** Selector for the empty element the scrollbar is built inside. */
	scrollerName?: string
	/** Where to look for wrappers. Defaults to `document`. */
	root?: ParentNode
	/** `"auto"` picks whichever axis actually overflows, preferring x on a tie. */
	axis?: Axis | "auto"
	/** Smallest the dragger may shrink to, in pixels. */
	minThumbSize?: number
	/** Clicking the track jumps the dragger to that spot and keeps dragging. */
	clickToJump?: boolean
	/** Arrow / Page / Home / End support once the dragger has focus. */
	keyboard?: boolean
	/** Pixels scrolled per arrow key press. */
	arrowStep?: number
	/** Re-measure automatically when the content or viewport changes size. */
	autoRefresh?: boolean
	/** Add the class that hides the element's native scrollbar. */
	hideNativeScrollbar?: boolean
}

/** A single initialised wrapper. */
export interface ExScrollInstance {
	readonly wrapper: HTMLElement
	readonly content: HTMLElement
	readonly scrollbar: HTMLElement
	readonly track: HTMLElement
	readonly dragger: HTMLElement
	readonly axis: Axis
	/** True while the content actually overflows along `axis`. */
	readonly scrollable: boolean
	/** Re-measure and redraw. Call after changing content that isn't auto-tracked. */
	refresh(): void
	/** Unbind listeners, disconnect observers and remove the injected DOM. */
	destroy(): void
}

/** The handle returned by `exScroll()`, covering every matched wrapper. */
export interface ExScrollController {
	readonly instances: ExScrollInstance[]
	refresh(): void
	destroy(): void
}
