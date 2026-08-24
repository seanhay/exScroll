/**
 * Pure scrollbar maths. No DOM in here, so the tricky parts are unit testable
 * without pretending a headless DOM has layout.
 */

export function clamp(value: number, min: number, max: number): number {
	if (Number.isNaN(value)) return min
	return value < min ? min : value > max ? max : value
}

export interface Metrics {
	/** Visible size of the content box along the axis. */
	clientSize: number
	/** Total scrollable size of the content along the axis. */
	scrollSize: number
	/** Size of the track the dragger travels along. */
	trackSize: number
	/** Largest valid scroll offset. */
	maxScroll: number
	/** Rendered size of the dragger. */
	thumbSize: number
	/** Distance the dragger can travel. */
	travel: number
	/** Whether there is anything to scroll. */
	scrollable: boolean
}

/**
 * Works out dragger size and travel for one axis.
 *
 * The dragger is sized proportionally (visible / total) but never allowed below
 * `minThumbSize`, which is why travel is derived from the final size rather than
 * from the ratio -- otherwise a very long page gives you a 2px dragger whose
 * position no longer maps linearly onto the scroll range.
 */
export function measure(
	clientSize: number,
	scrollSize: number,
	trackSize: number,
	minThumbSize: number,
): Metrics {
	const safeTrack = Math.max(0, trackSize)
	const maxScroll = Math.max(0, scrollSize - clientSize)
	// Sub-pixel layout rounding can leave a fraction of a pixel of "overflow"
	// on content that visually fits, so require a whole pixel before we
	// consider the axis scrollable.
	const scrollable = maxScroll >= 1 && clientSize > 0

	let thumbSize: number
	if (!scrollable) {
		thumbSize = safeTrack
	} else {
		const proportional = safeTrack * (clientSize / scrollSize)
		const floor = Math.min(minThumbSize, safeTrack)
		thumbSize = clamp(proportional, floor, safeTrack)
	}

	return {
		clientSize,
		scrollSize,
		trackSize: safeTrack,
		maxScroll,
		thumbSize,
		travel: Math.max(0, safeTrack - thumbSize),
		scrollable,
	}
}

/** Scroll offset -> 0..1 progress. */
export function progressFromScroll(scrollPos: number, maxScroll: number): number {
	if (maxScroll <= 0) return 0
	return clamp(scrollPos / maxScroll, 0, 1)
}

/** 0..1 progress -> dragger offset along the track. */
export function offsetFromProgress(progress: number, travel: number): number {
	return clamp(progress, 0, 1) * Math.max(0, travel)
}

/** Dragger offset along the track -> 0..1 progress. */
export function progressFromOffset(offset: number, travel: number): number {
	if (travel <= 0) return 0
	return clamp(offset / travel, 0, 1)
}

/** 0..1 progress -> scroll offset. */
export function scrollFromProgress(progress: number, maxScroll: number): number {
	return clamp(progress, 0, 1) * Math.max(0, maxScroll)
}
