import { describe, expect, it } from "vitest"
import {
	clamp,
	measure,
	offsetFromProgress,
	progressFromOffset,
	progressFromScroll,
	scrollFromProgress,
} from "../src/geometry"

describe("clamp", () => {
	it("bounds a value", () => {
		expect(clamp(5, 0, 10)).toBe(5)
		expect(clamp(-1, 0, 10)).toBe(0)
		expect(clamp(11, 0, 10)).toBe(10)
	})

	it("resolves NaN to the minimum rather than propagating it", () => {
		expect(clamp(Number.NaN, 0, 10)).toBe(0)
	})
})

describe("measure", () => {
	it("sizes the dragger proportionally to the visible fraction", () => {
		const m = measure(600, 2000, 600, 24)
		expect(m.thumbSize).toBe(180) // 600 * (600 / 2000)
		expect(m.travel).toBe(420)
		expect(m.maxScroll).toBe(1400)
		expect(m.scrollable).toBe(true)
	})

	it("never shrinks the dragger below minThumbSize", () => {
		const m = measure(100, 100_000, 400, 24)
		expect(m.thumbSize).toBe(24)
		expect(m.travel).toBe(376)
	})

	it("derives travel from the clamped size, keeping the mapping linear", () => {
		const m = measure(100, 100_000, 400, 24)
		// Full travel must still map onto the full scroll range.
		expect(scrollFromProgress(progressFromOffset(m.travel, m.travel), m.maxScroll))
			.toBe(m.maxScroll)
	})

	it("reports non-scrollable content", () => {
		const m = measure(600, 600, 600, 24)
		expect(m.scrollable).toBe(false)
		expect(m.travel).toBe(0)
	})

	it("ignores sub-pixel overflow", () => {
		expect(measure(600, 600.4, 600, 24).scrollable).toBe(false)
		expect(measure(600, 601, 600, 24).scrollable).toBe(true)
	})

	it("survives a zero-width track", () => {
		const m = measure(600, 2000, 0, 24)
		expect(m.thumbSize).toBe(0)
		expect(m.travel).toBe(0)
	})

	it("survives zero-size content without producing NaN", () => {
		const m = measure(0, 0, 600, 24)
		expect(m.scrollable).toBe(false)
		expect(Number.isNaN(m.thumbSize)).toBe(false)
	})
})

describe("progress round trip", () => {
	it("maps scroll -> offset -> scroll losslessly", () => {
		const m = measure(600, 2000, 600, 24)
		for (const scroll of [0, 1, 350, 700, 1399, 1400]) {
			const offset = offsetFromProgress(progressFromScroll(scroll, m.maxScroll), m.travel)
			const back = scrollFromProgress(progressFromOffset(offset, m.travel), m.maxScroll)
			expect(back).toBeCloseTo(scroll, 6)
		}
	})

	it("clamps out-of-range input instead of overshooting", () => {
		const m = measure(600, 2000, 600, 24)
		expect(progressFromScroll(-100, m.maxScroll)).toBe(0)
		expect(progressFromScroll(99_999, m.maxScroll)).toBe(1)
		expect(offsetFromProgress(2, m.travel)).toBe(m.travel)
	})

	it("returns zero progress when there is nothing to scroll", () => {
		expect(progressFromScroll(50, 0)).toBe(0)
		expect(progressFromOffset(50, 0)).toBe(0)
	})
})
