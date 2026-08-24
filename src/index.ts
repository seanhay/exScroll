import { Instance, type InstanceConfig } from "./instance"
import type {
	ExScrollController,
	ExScrollInstance,
	ExScrollOptions,
} from "./types"

export type {
	Axis,
	ExScrollController,
	ExScrollInstance,
	ExScrollOptions,
} from "./types"

const DEFAULTS: Required<Omit<ExScrollOptions, "root">> = {
	wrapperName: "[exscroll]",
	contentName: "[exscroll-content]",
	scrollerName: "[exscroll-scrollbar]",
	axis: "auto",
	minThumbSize: 24,
	clickToJump: true,
	keyboard: true,
	arrowStep: 40,
	autoRefresh: true,
	hideNativeScrollbar: true,
}

/** One instance per wrapper, so a second call can't double-initialise. */
const registry = new WeakMap<Element, Instance>()

function warn(message: string, element: Element): void {
	console.warn(`[exscroll] ${message}`, element)
}

/**
 * Builds an external scrollbar for every wrapper matching `wrapperName`.
 *
 * Wrappers that are missing their content or scrollbar element are skipped with
 * a warning rather than throwing, so one bad block can't take down the rest of
 * the page. Wrappers that are already initialised are returned as-is.
 */
export function exScroll(options: ExScrollOptions = {}): ExScrollController {
	const config: InstanceConfig = { ...DEFAULTS, ...options }
	const root = options.root ?? document
	const instances: Instance[] = []

	const wrapperSelector = options.wrapperName ?? DEFAULTS.wrapperName
	const contentSelector = options.contentName ?? DEFAULTS.contentName
	const scrollerSelector = options.scrollerName ?? DEFAULTS.scrollerName

	const wrappers = root.querySelectorAll<HTMLElement>(wrapperSelector)

	wrappers.forEach((wrapper) => {
		const existing = registry.get(wrapper)
		if (existing && !existing.isDestroyed) {
			instances.push(existing)
			return
		}

		const content = wrapper.querySelector<HTMLElement>(contentSelector)
		if (!content) {
			warn(`no content element matching "${contentSelector}" in wrapper`, wrapper)
			return
		}

		const scrollbar = wrapper.querySelector<HTMLElement>(scrollerSelector)
		if (!scrollbar) {
			warn(`no scrollbar element matching "${scrollerSelector}" in wrapper`, wrapper)
			return
		}

		const instance = new Instance(wrapper, content, scrollbar, config)
		registry.set(wrapper, instance)
		instances.push(instance)
	})

	return {
		instances: instances as ExScrollInstance[],
		refresh() {
			for (const instance of instances) instance.refresh()
		},
		destroy() {
			for (const instance of instances) {
				instance.destroy()
				registry.delete(instance.wrapper)
			}
			instances.length = 0
		},
	}
}

export default exScroll
