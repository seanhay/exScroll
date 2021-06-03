# exScroll
A lightweight javascript plugin for adding a customisable, responsive scrollbar to a location outside of (but linked to!) any overflowing container.

## Quick start
### Install
This package can be installed with npm: `npm install --save exscroll`

The required javascript is found at:
```html
<script src="/node_modules/exscroll/dist/exScroll.js">
```
The required CSS is found at:
```html
<link rel="stylesheet" href="/node_modules/exscroll/dist/exScroll.css">
```

### Usage
The plugin requires the following DOM structure, though the attributes can optionally be replaced by classes during initialisation:
```html
<div exscroll>
    <div exscroll-content></div>
    <div exscroll-scrollbar></div>
</div>
```
Then the plugin can be initialised with:
```javascript
exScroll();
```

### Options
Currently, the options are only for the structure, which can be modified with class names:
```html
<div class="wrapper">
    <div class="content"></div>
    <div class="scrollbar"></div>
</div>
```
```javascript
exScroll({
    wrapperName:  ".wrapper",
    contentName:  ".content",
    scrollerName: ".scrollbar",
});
```

## TODO
- [ ] Make an init function
- [ ] Make a destroy function
- [ ] Adjust recalculations for media queries
- [ ] Add screenshots to docs
- [ ] Rewrite docs for legibility
