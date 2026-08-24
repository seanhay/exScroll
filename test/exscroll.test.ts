import { beforeEach, describe, expect, it, vi } from "vitest"
import { exScroll } from "../src/index"
import { mount, nextFrame, pointer } from "./helpers"

/** Init, then stub the track's size and re-measure (happy-dom has no layout). */
function init(ui: ReturnType<typeof mount>, options = {}) {
	const controller = exScroll({ autoRefresh: false, ...options })
	ui.track()
	controller.refresh()
	return controller
}

beforeEach(() => {
	document.body.innerHTML = ""
})

describe("structure", () => {
	it("builds a track and dragger inside the scrollbar element", () => {
		const ui = mount()
		init(ui)

		expect(ui.track()).toBeTruthy()
		expect(ui.dragger()).toBeTruthy()
		expect(ui.dragger().parentElement).toBe(ui.track())
		expect(ui.track().parentElement).toBe(ui.scrollbar)
	})

	it("applies the class that hides the native scrollbar", () => {
		const ui = mount()
		init(ui)
		expect(ui.content.classList.contains("exscroll-content")).toBe(true)
	})

	it("leaves the native scrollbar alone when asked", () => {
		const ui = mount()
		init(ui, { hideNativeScrollbar: false })
		expect(ui.content.classList.contains("exscroll-content")).toBe(false)
	})

	it("sizes the dragger from the visible fraction", () => {
		const ui = mount({ clientWidth: 600, scrollWidth: 2000, trackWidth: 600 })
		init(ui)
		expect(ui.dragger().style.width).toBe("180px")
	})
})

describe("guards", () => {
	it("warns and skips a wrapper with no content element", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		const ui = mount({ withContent: false })

		expect(() => exScroll({ autoRefresh: false })).not.toThrow()
		expect(warn).toHaveBeenCalledOnce()
		expect(ui.scrollbar.querySelector(".exscroll-track")).toBeNull()
		warn.mockRestore()
	})

	it("warns and skips a wrapper with no scrollbar element", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		mount({ withScrollbar: false })

		expect(() => exScroll({ autoRefresh: false })).not.toThrow()
		expect(warn).toHaveBeenCalledOnce()
		warn.mockRestore()
	})

	it("does not double-initialise the same wrapper", () => {
		const ui = mount()
		init(ui)
		const second = exScroll({ autoRefresh: false })

		expect(ui.scrollbar.querySelectorAll(".exscroll-track")).toHaveLength(1)
		expect(second.instances).toHaveLength(1)
	})

	it("hides the bar and reports non-scrollable when content fits", () => {
		const ui = mount({ clientWidth: 600, scrollWidth: 600 })
		const s = init(ui)

		expect(s.instances[0]!.scrollable).toBe(false)
		expect(ui.scrollbar.classList.contains("exscroll-hidden")).toBe(true)
		expect(ui.dragger().getAttribute("aria-hidden")).toBe("true")
	})
})

describe("axis", () => {
	it("auto-detects a horizontal overflow", () => {
		const ui = mount({ clientWidth: 600, scrollWidth: 2000 })
		const s = init(ui)
		expect(s.instances[0]!.axis).toBe("x")
		expect(ui.scrollbar.classList.contains("exscroll-scrollbar--x")).toBe(true)
	})

	it("auto-detects a vertical overflow", () => {
		const ui = mount({
			clientWidth: 600,
			scrollWidth: 600,
			clientHeight: 300,
			scrollHeight: 3000,
			trackHeight: 300,
		})
		const s = init(ui)

		expect(s.instances[0]!.axis).toBe("y")
		expect(ui.scrollbar.classList.contains("exscroll-scrollbar--y")).toBe(true)
		expect(ui.dragger().getAttribute("aria-orientation")).toBe("vertical")
		expect(ui.dragger().style.height).toBe("30px") // 300 * (300 / 3000)
	})

	it("honours an explicit axis over detection", () => {
		const ui = mount({ clientHeight: 300, scrollHeight: 3000, trackHeight: 300 })
		const s = init(ui, { axis: "y" })
		expect(s.instances[0]!.axis).toBe("y")
	})
})

describe("content -> scrollbar", () => {
	it("moves the dragger when the content scrolls", async () => {
		const ui = mount()
		init(ui)

		ui.content.scrollLeft = 700 // half of maxScroll (1400)
		ui.content.dispatchEvent(new Event("scroll"))
		await nextFrame()

		expect(ui.dragger().style.transform).toBe("translateX(210px)") // half of 420
		expect(ui.dragger().getAttribute("aria-valuenow")).toBe("50")
	})

	it("does not grow the style attribute on repeated scrolls", async () => {
		const ui = mount()
		init(ui)
		const dragger = ui.dragger()

		ui.content.scrollLeft = 100
		ui.content.dispatchEvent(new Event("scroll"))
		await nextFrame()
		const first = dragger.getAttribute("style")!.length

		for (let i = 0; i < 50; i++) {
			ui.content.scrollLeft = 100 + i
			ui.content.dispatchEvent(new Event("scroll"))
			await nextFrame()
		}

		// v1 appended to cssText on every move, so this grew without bound.
		expect(dragger.getAttribute("style")!.length).toBeLessThanOrEqual(first + 2)
	})
})

describe("scrollbar -> content", () => {
	it("scrolls the content when the dragger is dragged", () => {
		const ui = mount()
		init(ui)
		const dragger = ui.dragger()

		dragger.dispatchEvent(pointer("pointerdown", { clientX: 0 }))
		dragger.dispatchEvent(pointer("pointermove", { clientX: 210 }))

		expect(ui.content.scrollLeft).toBe(700)
		expect(dragger.style.transform).toBe("translateX(210px)")
	})

	it("clamps at both ends instead of overshooting", () => {
		const ui = mount()
		init(ui)
		const dragger = ui.dragger()

		dragger.dispatchEvent(pointer("pointerdown", { clientX: 0 }))
		dragger.dispatchEvent(pointer("pointermove", { clientX: 99_999 }))
		expect(ui.content.scrollLeft).toBe(1400)
		expect(dragger.style.transform).toBe("translateX(420px)")

		dragger.dispatchEvent(pointer("pointermove", { clientX: -99_999 }))
		expect(ui.content.scrollLeft).toBe(0)
		expect(dragger.style.transform).toBe("translateX(0px)")
	})

	it("ignores pointer moves once the drag has ended", () => {
		const ui = mount()
		init(ui)
		const dragger = ui.dragger()

		dragger.dispatchEvent(pointer("pointerdown", { clientX: 0 }))
		dragger.dispatchEvent(pointer("pointerup", { clientX: 0 }))
		dragger.dispatchEvent(pointer("pointermove", { clientX: 210 }))

		expect(ui.content.scrollLeft).toBe(0)
	})

	it("survives a pointer id with no live pointer to capture", () => {
		const ui = mount()
		init(ui)
		const dragger = ui.dragger()
		// Real Chrome throws NotFoundError here; the drag must still work.
		dragger.setPointerCapture = () => {
			throw new DOMException("No active pointer", "NotFoundError")
		}

		expect(() => {
			dragger.dispatchEvent(pointer("pointerdown", { clientX: 0 }))
		}).not.toThrow()

		dragger.dispatchEvent(pointer("pointermove", { clientX: 210 }))
		expect(ui.content.scrollLeft).toBe(700)
	})

	it("ignores a non-primary button", () => {
		const ui = mount()
		init(ui)
		const dragger = ui.dragger()

		dragger.dispatchEvent(pointer("pointerdown", { clientX: 0, button: 2 }))
		dragger.dispatchEvent(pointer("pointermove", { clientX: 210 }))

		expect(ui.content.scrollLeft).toBe(0)
	})

	it("does not start a drag from a pointerdown on the content", () => {
		const ui = mount()
		init(ui)

		// v1 bound mousedown to the wrapper, so this scrolled the content backwards.
		ui.content.dispatchEvent(pointer("pointerdown", { clientX: 0 }))
		ui.content.dispatchEvent(pointer("pointermove", { clientX: 210 }))

		expect(ui.content.scrollLeft).toBe(0)
	})
})

describe("keyboard", () => {
	it("steps with the arrow keys", () => {
		const ui = mount()
		init(ui, { arrowStep: 40 })

		ui.dragger().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))
		expect(ui.content.scrollLeft).toBe(40)

		ui.dragger().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))
		expect(ui.content.scrollLeft).toBe(0)
	})

	it("jumps to the ends with Home and End", () => {
		const ui = mount()
		init(ui)

		ui.dragger().dispatchEvent(new KeyboardEvent("keydown", { key: "End" }))
		expect(ui.content.scrollLeft).toBe(1400)

		ui.dragger().dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }))
		expect(ui.content.scrollLeft).toBe(0)
	})

	it("pages by the visible size", () => {
		const ui = mount()
		init(ui)

		ui.dragger().dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown" }))
		expect(ui.content.scrollLeft).toBe(600)
	})

	it("stays inert when keyboard support is off", () => {
		const ui = mount()
		init(ui, { keyboard: false })

		ui.dragger().dispatchEvent(new KeyboardEvent("keydown", { key: "End" }))
		expect(ui.content.scrollLeft).toBe(0)
		expect(ui.dragger().hasAttribute("tabindex")).toBe(false)
	})
})

describe("accessibility", () => {
	it("exposes scrollbar semantics wired to the content", () => {
		const ui = mount()
		init(ui)
		const dragger = ui.dragger()

		expect(dragger.getAttribute("role")).toBe("scrollbar")
		expect(dragger.getAttribute("aria-orientation")).toBe("horizontal")
		expect(dragger.getAttribute("aria-valuemin")).toBe("0")
		expect(dragger.getAttribute("aria-valuemax")).toBe("100")
		expect(dragger.getAttribute("aria-controls")).toBe(ui.content.id)
		expect(ui.content.id).toBeTruthy()
		expect(dragger.tabIndex).toBe(0)
	})

	it("does not clobber an existing content id", () => {
		const ui = mount()
		ui.content.id = "my-content"
		init(ui)

		expect(ui.dragger().getAttribute("aria-controls")).toBe("my-content")
	})
})

describe("destroy", () => {
	it("removes the injected DOM and the added classes", () => {
		const ui = mount()
		const s = init(ui)
		s.destroy()

		expect(ui.scrollbar.querySelector(".exscroll-track")).toBeNull()
		expect(ui.scrollbar.classList.contains("exscroll-scrollbar")).toBe(false)
		expect(ui.content.classList.contains("exscroll-content")).toBe(false)
		expect(ui.scrollbar.dataset["exscrollAxis"]).toBeUndefined()
	})

	it("removes only the id it generated", () => {
		const ui = mount()
		init(ui).destroy()
		expect(ui.content.hasAttribute("id")).toBe(false)

		const other = mount()
		other.content.id = "kept"
		init(other).destroy()
		expect(other.content.id).toBe("kept")
	})

	it("stops responding to scroll events", async () => {
		const ui = mount()
		const s = init(ui)
		// Hold the reference: destroy detaches the dragger from the document.
		const dragger = ui.dragger()
		const before = dragger.style.transform

		s.destroy()
		ui.content.scrollLeft = 700
		ui.content.dispatchEvent(new Event("scroll"))
		await nextFrame()

		expect(dragger.style.transform).toBe(before)
	})

	it("is idempotent", () => {
		const ui = mount()
		const s = init(ui)
		expect(() => {
			s.destroy()
			s.destroy()
		}).not.toThrow()
	})

	it("allows re-initialising the same wrapper afterwards", () => {
		const ui = mount()
		init(ui).destroy()

		const again = exScroll({ autoRefresh: false })
		expect(again.instances).toHaveLength(1)
		expect(ui.scrollbar.querySelectorAll(".exscroll-track")).toHaveLength(1)
	})
})

describe("refresh", () => {
	it("re-measures after the content changes size", () => {
		const ui = mount({ clientWidth: 600, scrollWidth: 2000, trackWidth: 600 })
		const s = init(ui)
		expect(ui.dragger().style.width).toBe("180px")

		Object.defineProperty(ui.content, "scrollWidth", {
			configurable: true,
			get: () => 1200,
		})
		s.refresh()

		expect(ui.dragger().style.width).toBe("300px") // 600 * (600 / 1200)
	})

	it("scopes initialisation to the given root", () => {
		mount()
		const scoped = document.createElement("section")
		document.body.appendChild(scoped)

		const s = exScroll({ root: scoped, autoRefresh: false })
		expect(s.instances).toHaveLength(0)
	})
})
