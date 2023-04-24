"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function exScroll() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var defaultOptions = {
    wrapperName: '[exscroll]',
    contentName: '[exscroll-content]',
    scrollerName: '[exscroll-scrollbar]'
  };
  var options = _objectSpread(_objectSpread({}, defaultOptions), opts);
  var containers = document.querySelectorAll(options.wrapperName);
  containers.forEach(function (container) {
    var el = container.querySelector(options.contentName);
    var scrollbar = container.querySelector(options.scrollerName);

    // Add classes
    el.classList.add('exscroll-wrapper');
    scrollbar.classList.add('exscroll-scrollbar');

    // Structure constructor
    var scrollDragger = document.createElement('span');
    scrollDragger.classList.add('exscroll-dragger');
    var scrollTrack = document.createElement('div');
    scrollTrack.classList.add('exscroll-track');
    scrollTrack.appendChild(scrollDragger);
    scrollbar.appendChild(scrollTrack);

    // Set initial vars
    var isScrolling = false;
    var scrollStart = 0;
    var scrollPercent = 0;
    var elScrollWidth = el.scrollWidth;
    var elVisibleWidth = el.offsetWidth;
    var elVisiblePercentage = elVisibleWidth / elScrollWidth * 100;
    scrollDragger.style.cssText = "width:".concat(elVisiblePercentage, "%");

    // Scrolling the scrollable container
    el.addEventListener("scroll", function (e) {
      if (!isScrolling) {
        scrollPercent = el.scrollLeft / (el.scrollWidth - el.offsetWidth) * (100 - elVisiblePercentage);
        scrollDragger.style.cssText += ";left:".concat(scrollPercent, "%");
      }
    });

    // Start scrolling the external scrollbar - touch
    container.addEventListener("mousedown", scrollStartHandler);
    scrollDragger.addEventListener("touchstart", scrollStartHandler);
    function scrollStartHandler(event) {
      isScrolling = true;
      scrollStart = event.touches ? event.touches[0].clientX : event.clientX;
    }

    // Stop scrolling the external scrollbar - touch
    document.addEventListener("mouseup", scrollUpHandler);
    container.addEventListener("touchend", scrollUpHandler);
    function scrollUpHandler() {
      if (isScrolling) {
        scrollPercent = el.scrollLeft / (el.scrollWidth - el.offsetWidth) * (100 - elVisiblePercentage);
        isScrolling = false;
      }
    }

    // Dragging the scroll element - touch
    document.addEventListener("mousemove", scrollMoveHandler);
    container.addEventListener("touchmove", scrollMoveHandler);
    function scrollMoveHandler(event) {
      if (isScrolling) {
        var scrollPos = event.touches ? event.touches[0].clientX : event.clientX;
        var scrollOffsetPercent = (scrollPos - scrollStart) / scrollTrack.offsetWidth * 100;
        if (scrollPercent + scrollOffsetPercent >= 0 && scrollPercent + scrollOffsetPercent <= 100 - elVisiblePercentage) {
          // While is inside container bounds
          scrollDragger.style.cssText += "; left: ".concat(scrollPercent + scrollOffsetPercent, "%");
          el.scrollLeft = (scrollPercent + scrollOffsetPercent) / 100 * elScrollWidth;
        } else if (scrollPercent + scrollOffsetPercent < 0) {
          // If overextends to left
          scrollDragger.style.cssText += "; left: 0%";
          el.scrollLeft = 0;
        } else if (scrollPercent + scrollOffsetPercent > 100 - elVisiblePercentage) {
          // If overextends to right
          scrollDragger.style.cssText += "; left: ".concat(100 - elVisiblePercentage, "%");
          el.scrollLeft = elScrollWidth;
        }
      }
    }
  });
}
if (typeof exports !== "undefined") {
  module.exports.exScroll;
}