# exScroll

A dependency-free plugin for putting a customisable scrollbar **outside** the element it scrolls — anywhere on the page, styled however you like, on either axis.

- 8.4 kB minified / 2.6 kB gzipped, no dependencies
- Horizontal **and** vertical, auto-detected
- Pointer Events: mouse, touch and pen take the same code path
- Keyboard accessible, with `role="scrollbar"` semantics
- Re-measures itself when content or viewport changes
- Real `destroy()` and `refresh()`
- TypeScript throughout, with shipped `.d.ts`

## Install

```sh
npm install exscroll
```

## Usage

The plugin needs three elements: a wrapper, the overflowing content, and an empty element to build the bar inside.

```html
<div exscroll>
	<div exscroll-content>…wide or tall content…</div>
	<div exscroll-scrollbar></div>
</div>
```

```js
import exScroll from "exscroll"
import "exscroll/style.css"

const scroller = exScroll()
```

### Without a bundler

The `dist/exscroll.global.js` build defines a global `exScroll`:

```html
<link rel="stylesheet" href="/node_modules/exscroll/dist/exscroll.css" />
<script src="/node_modules/exscroll/dist/exscroll.global.js"></script>
<script>
	exScroll()
</script>
```

### Custom selectors

Attributes are the default, but any selector works:

```html
<div class="gallery">
	<div class="gallery__track">…</div>
	<div class="gallery__bar"></div>
</div>
```

```js
exScroll({
	wrapperName: ".gallery",
	contentName: ".gallery__track",
	scrollerName: ".gallery__bar",
})
```

## Options

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `wrapperName` | `string` | `"[exscroll]"` | Selector for each wrapper. |
| `contentName` | `string` | `"[exscroll-content]"` | Selector for the overflowing element, resolved inside each wrapper. |
| `scrollerName` | `string` | `"[exscroll-scrollbar]"` | Selector for the element the bar is built inside. |
| `root` | `ParentNode` | `document` | Where to look for wrappers. Handy for scoping to a fragment. |
| `axis` | `"auto" \| "x" \| "y"` | `"auto"` | `"auto"` picks whichever axis actually overflows, preferring `x` on a tie. |
| `minThumbSize` | `number` | `24` | Smallest the dragger may shrink to, in pixels. |
| `clickToJump` | `boolean` | `true` | Clicking the track moves the dragger there and keeps scrubbing. |
| `keyboard` | `boolean` | `true` | Arrow / Page / Home / End once the dragger has focus. |
| `arrowStep` | `number` | `40` | Pixels scrolled per arrow key press. |
| `autoRefresh` | `boolean` | `true` | Re-measure automatically when content or viewport size changes. |
| `hideNativeScrollbar` | `boolean` | `true` | Add the class that hides the element's own scrollbar. |

## API

`exScroll()` returns a controller covering every wrapper it matched:

```js
const scroller = exScroll()

scroller.instances // one entry per wrapper
scroller.refresh() // re-measure everything
scroller.destroy() // unbind, disconnect observers, remove injected DOM
```

Each instance exposes the same lifecycle plus its own state:

```js
const [first] = scroller.instances

first.axis // "x" | "y"
first.scrollable // false when the content currently fits
first.wrapper // the elements it's wired to
first.content
first.scrollbar
first.track
first.dragger

first.refresh()
first.destroy()
```

`destroy()` is idempotent, and a destroyed wrapper can be initialised again later. Calling `exScroll()` twice over the same wrapper returns the existing instance rather than building a second bar.

## Styling

The shipped CSS is driven entirely by custom properties, so you can retheme without out-specifying anything:

```css
.my-scrollbar {
	--exscroll-size: 18px;
	--exscroll-padding: 2px;
	--exscroll-track-bg: #1e1b4b;
	--exscroll-track-border: none;
	--exscroll-track-radius: 9999px;
	--exscroll-dragger-bg: #818cf8;
	--exscroll-dragger-bg-hover: #a5b4fc;
	--exscroll-dragger-bg-active: #c7d2fe;
	--exscroll-dragger-radius: 9999px;
	--exscroll-transition: 120ms ease;
}
```

Classes applied at runtime:

| Class | On | Meaning |
| --- | --- | --- |
| `.exscroll-content` | content | Hides the native scrollbar. |
| `.exscroll-scrollbar` | scrollbar | Base bar styling. |
| `.exscroll-scrollbar--x` / `--y` | scrollbar | Current axis. Also exposed as `data-exscroll-axis`. |
| `.exscroll-track` | injected | The dragger's travel area. |
| `.exscroll-dragger` | injected | The draggable thumb. |
| `.exscroll-hidden` | scrollbar | Content currently fits. `display: none` by default. |
| `.exscroll-dragging` | scrollbar | A drag is in progress. |

To keep the bar in the layout when there's nothing to scroll, override the hidden state:

```css
.exscroll-hidden {
	display: block;
	opacity: 0;
	pointer-events: none;
}
```

## Accessibility

The dragger carries `role="scrollbar"`, `aria-orientation`, `aria-controls` pointing at the content, and a live `aria-valuenow` from 0–100. It's focusable while the content is scrollable and removed from the tab order when it isn't. Keyboard support covers arrows, `PageUp`/`PageDown`, `Home` and `End`. The dragger's transition is dropped under `prefers-reduced-motion`.

## Migrating from v1

Call sites keep working — `exScroll(options)` with the same three selector options behaves as before. The changes:

- **`new` is no longer needed.** `exScroll()` is a plain call that returns a controller.
- **The content element's class is now `.exscroll-content`**, not `.exscroll-wrapper`. v1 applied a class called "wrapper" to the element that *wasn't* the wrapper; if you overrode it, rename your rule.
- **The dragger is positioned with `transform`, not `left`.** Custom CSS that set `left` on `.exscroll-dragger` should move to `transform`.
- **Axis is auto-detected.** Pass `axis: "x"` to pin the old horizontal-only behaviour.
- **Track markup is unchanged** — still `.exscroll-track > .exscroll-dragger` inside your scrollbar element.

## Browser support

Needs Pointer Events, `ResizeObserver`, and `AbortSignal` on `addEventListener`: Chrome 88+, Firefox 86+, Safari 15+. `autoRefresh` degrades gracefully where the observers are missing — call `refresh()` yourself.

## Development

```sh
pnpm install
pnpm build      # dist/: ESM, IIFE, .d.ts and CSS
pnpm test       # vitest
pnpm typecheck
pnpm demo       # build, then serve demo/ at localhost:5173
```

## License

MIT © Sean Hay
