import { getAdapter, detectAxis, type AxisAdapter } from "./axis"
import {
	clamp,
	measure,
	offsetFromProgress,
	progressFromOffset,
	progressFromScroll,
	scrollFromProgress,
	type Metrics,
} from "./geometry"
import type { Axis, ExScrollInstance } from "./types"

export const CLASS = {
	content: "exscroll-content",
	scrollbar: "exscroll-scrollbar",
	track: "exscroll-track",
	dragger: "exscroll-dragger",
	hidden: "exscroll-hidden",
	dragging: "exscroll-dragging",
} as const

export interface InstanceConfig {
	axis: Axis | "auto"
	minThumbSize: number
	clickToJump: boolean
	keyboard: boolean
	arrowStep: number
	autoRefresh: boolean
	hideNativeScrollbar: boolean
}

let uid = 0

const EMPTY_METRICS: Metrics = {
	clientSize: 0,
	scrollSize: 0,
	trackSize: 0,
	maxScroll: 0,
	thumbSize: 0,
	travel: 0,
	scrollable: false,
}

export class Instance implements ExScrollInstance {
	readonly wrapper: HTMLElement
	readonly content: HTMLElement
	readonly scrollbar: HTMLElement
	readonly track: HTMLElement
	readonly dragger: HTMLElement

	axis: Axis
	scrollable = false

	private readonly config: InstanceConfig
	private readonly controller = new AbortController()
	private adapter: AxisAdapter
	private metrics: Metrics = EMPTY_METRICS

	private dragging = false
	private dragPointerId: number | null = null
	private dragStartCoord = 0
	private dragStartOffset = 0
	private offset = 0

	private resizeObserver: ResizeObserver | null = null
	private mutationObserver: MutationObserver | null = null
	private frame = 0
	private generatedId: string | null = null
	private destroyed = false

	constructor(
		wrapper: HTMLElement,
		content: HTMLElement,
		scrollbar: HTMLElement,
		config: InstanceConfig,
	) {
		this.wrapper = wrapper
		this.content = content
		this.scrollbar = scrollbar
		this.config = config

		this.axis = config.axis === "auto" ? detectAxis(content) : config.axis
		this.adapter = getAdapter(this.axis)

		this.track = document.createElement("div")
		this.track.className = CLASS.track
		this.dragger = document.createElement("span")
		this.dragger.className = CLASS.dragger
		this.track.appendChild(this.dragger)
		this.scrollbar.appendChild(this.track)

		if (config.hideNativeScrollbar) {
			this.content.classList.add(CLASS.content)
		}
		this.scrollbar.classList.add(CLASS.scrollbar)
		this.applyAxisAttributes()
		this.setupAria()
		this.bind()
		this.observe()
		this.refresh()
	}

	/** Internal: lets the registry tell a stale entry from a live one. */
	get isDestroyed(): boolean {
		return this.destroyed
	}

	// -- setup ---------------------------------------------------------------

	private applyAxisAttributes(): void {
		this.scrollbar.classList.remove(
			`${CLASS.scrollbar}--x`,
			`${CLASS.scrollbar}--y`,
		)
		this.scrollbar.classList.add(`${CLASS.scrollbar}--${this.axis}`)
		this.scrollbar.dataset["exscrollAxis"] = this.axis
		this.dragger.setAttribute("aria-orientation", this.adapter.orientation)
	}

	private setupAria(): void {
		if (!this.content.id) {
			this.generatedId = `exscroll-content-${++uid}`
			this.content.id = this.generatedId
		}
		this.dragger.setAttribute("role", "scrollbar")
		this.dragger.setAttribute("aria-controls", this.content.id)
		this.dragger.setAttribute("aria-valuemin", "0")
		this.dragger.setAttribute("aria-valuemax", "100")
		this.dragger.setAttribute("aria-valuenow", "0")
		if (this.config.keyboard) this.dragger.tabIndex = 0
	}

	private bind(): void {
		const { signal } = this.controller

		this.content.addEventListener("scroll", this.onScroll, {
			passive: true,
			signal,
		})
		// Pointer Events cover mouse, touch and pen through one path, which is
		// what stops the two input modes from drifting apart.
		this.dragger.addEventListener("pointerdown", this.onPointerDown, { signal })
		this.dragger.addEventListener("pointermove", this.onPointerMove, { signal })
		this.dragger.addEventListener("pointerup", this.onPointerUp, { signal })
		this.dragger.addEventListener("pointercancel", this.onPointerUp, { signal })

		if (this.config.clickToJump) {
			this.track.addEventListener("pointerdown", this.onTrackPointerDown, {
				signal,
			})
		}
		if (this.config.keyboard) {
			this.dragger.addEventListener("keydown", this.onKeyDown, { signal })
		}
	}

	private observe(): void {
		if (!this.config.autoRefresh) return

		if (typeof ResizeObserver !== "undefined") {
			this.resizeObserver = new ResizeObserver(this.scheduleRefresh)
			this.resizeObserver.observe(this.wrapper)
			this.resizeObserver.observe(this.content)
			this.resizeObserver.observe(this.scrollbar)
		}
		// A ResizeObserver on the content element fires when *it* changes size,
		// not when its children change scrollWidth, so watch the subtree too.
		if (typeof MutationObserver !== "undefined") {
			this.mutationObserver = new MutationObserver(this.scheduleRefresh)
			this.mutationObserver.observe(this.content, {
				childList: true,
				subtree: true,
				characterData: true,
			})
		}
	}

	// -- measurement ---------------------------------------------------------

	refresh(): void {
		if (this.destroyed) return

		if (this.config.axis === "auto") {
			const next = detectAxis(this.content)
			if (next !== this.axis) {
				this.axis = next
				this.adapter = getAdapter(next)
				this.applyAxisAttributes()
			}
		}

		const { adapter } = this
		this.metrics = measure(
			adapter.clientSize(this.content),
			adapter.scrollSize(this.content),
			adapter.clientSize(this.track),
			this.config.minThumbSize,
		)
		this.scrollable = this.metrics.scrollable

		this.scrollbar.classList.toggle(CLASS.hidden, !this.scrollable)
		this.dragger.setAttribute("aria-hidden", this.scrollable ? "false" : "true")
		if (this.config.keyboard) this.dragger.tabIndex = this.scrollable ? 0 : -1

		// Size along the axis; the cross axis is left entirely to CSS.
		this.dragger.style[adapter.sizeProp] = `${this.metrics.thumbSize}px`

		this.syncFromContent()
	}

	private scheduleRefresh = (): void => {
		if (this.destroyed || this.frame) return
		this.frame = requestAnimationFrame(() => {
			this.frame = 0
			this.refresh()
		})
	}

	// -- content -> scrollbar ------------------------------------------------

	private onScroll = (): void => {
		if (this.dragging || this.destroyed || this.frame) return
		this.frame = requestAnimationFrame(() => {
			this.frame = 0
			this.syncFromContent()
		})
	}

	private syncFromContent(): void {
		const progress = progressFromScroll(
			this.adapter.getScroll(this.content),
			this.metrics.maxScroll,
		)
		this.paint(offsetFromProgress(progress, this.metrics.travel), progress)
	}

	/**
	 * Writes the dragger position. Uses `transform` rather than `left`/`top` so
	 * dragging stays on the compositor, and assigns a single style property
	 * instead of appending to `cssText`.
	 */
	private paint(offset: number, progress: number): void {
		this.offset = offset
		this.dragger.style.transform = this.adapter.translate(offset)
		this.dragger.setAttribute("aria-valuenow", String(Math.round(progress * 100)))
	}

	// -- scrollbar -> content ------------------------------------------------

	private applyOffset(offset: number): void {
		const clamped = clamp(offset, 0, this.metrics.travel)
		const progress = progressFromOffset(clamped, this.metrics.travel)
		this.paint(clamped, progress)
		this.adapter.setScroll(
			this.content,
			scrollFromProgress(progress, this.metrics.maxScroll),
		)
	}

	private onPointerDown = (event: PointerEvent): void => {
		if (!this.scrollable || event.button !== 0) return
		event.preventDefault()
		event.stopPropagation()
		this.beginDrag(event)
	}

	private beginDrag(event: PointerEvent): void {
		this.dragging = true
		this.dragPointerId = event.pointerId
		this.dragStartCoord = this.adapter.coord(event)
		this.dragStartOffset = this.offset
		this.scrollbar.classList.add(CLASS.dragging)
		this.capturePointer(event.pointerId)
	}

	/**
	 * Pointer capture keeps the drag alive outside the element, which is why
	 * there are no document-level listeners to leak. It throws if the id has no
	 * live pointer (a synthetic event, or a pointer already released), and that
	 * must not take the handler down with it -- the drag works regardless.
	 */
	private capturePointer(pointerId: number): void {
		try {
			this.dragger.setPointerCapture?.(pointerId)
		} catch {
			/* capture is an optimisation, not a requirement */
		}
	}

	private releasePointer(pointerId: number): void {
		try {
			this.dragger.releasePointerCapture?.(pointerId)
		} catch {
			/* already released */
		}
	}

	private onPointerMove = (event: PointerEvent): void => {
		if (!this.dragging || event.pointerId !== this.dragPointerId) return
		event.preventDefault()
		const delta = this.adapter.coord(event) - this.dragStartCoord
		this.applyOffset(this.dragStartOffset + delta)
	}

	private onPointerUp = (event: PointerEvent): void => {
		if (!this.dragging || event.pointerId !== this.dragPointerId) return
		this.dragging = false
		this.dragPointerId = null
		this.scrollbar.classList.remove(CLASS.dragging)
		this.releasePointer(event.pointerId)
	}

	private onTrackPointerDown = (event: PointerEvent): void => {
		if (!this.scrollable || event.button !== 0) return
		if (event.target === this.dragger || this.dragger.contains(event.target as Node)) {
			return
		}
		event.preventDefault()

		const rect = this.track.getBoundingClientRect()
		const local = this.adapter.coord(event) - this.adapter.rectStart(rect)
		this.applyOffset(local - this.metrics.thumbSize / 2)

		// Continue as a drag so a click-and-hold scrubs, matching native bars.
		this.beginDrag(event)
	}

	private onKeyDown = (event: KeyboardEvent): void => {
		if (!this.scrollable) return
		const { adapter, metrics } = this
		const current = adapter.getScroll(this.content)
		let next: number | null = null

		if (adapter.isDecreaseKey(event.key)) next = current - this.config.arrowStep
		else if (adapter.isIncreaseKey(event.key)) next = current + this.config.arrowStep
		else if (event.key === "PageUp") next = current - metrics.clientSize
		else if (event.key === "PageDown") next = current + metrics.clientSize
		else if (event.key === "Home") next = 0
		else if (event.key === "End") next = metrics.maxScroll

		if (next === null) return
		event.preventDefault()

		const progress = progressFromScroll(
			clamp(next, 0, metrics.maxScroll),
			metrics.maxScroll,
		)
		this.applyOffset(offsetFromProgress(progress, metrics.travel))
	}

	// -- teardown ------------------------------------------------------------

	destroy(): void {
		if (this.destroyed) return
		this.destroyed = true

		// One abort removes every listener registered with the signal.
		this.controller.abort()
		this.resizeObserver?.disconnect()
		this.mutationObserver?.disconnect()
		this.resizeObserver = null
		this.mutationObserver = null
		if (this.frame) cancelAnimationFrame(this.frame)
		this.frame = 0

		this.track.remove()
		this.content.classList.remove(CLASS.content)
		this.scrollbar.classList.remove(
			CLASS.scrollbar,
			CLASS.hidden,
			CLASS.dragging,
			`${CLASS.scrollbar}--x`,
			`${CLASS.scrollbar}--y`,
		)
		delete this.scrollbar.dataset["exscrollAxis"]
		if (this.generatedId && this.content.id === this.generatedId) {
			this.content.removeAttribute("id")
		}
	}
}
