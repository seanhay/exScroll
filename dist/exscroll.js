"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
    var scrollbar = container.querySelector(options.scrollerName); // Add classes

    el.classList.add('exscroll-wrapper');
    scrollbar.classList.add('exscroll-scrollbar'); // Structure constructor

    var scrollDragger = document.createElement('span');
    scrollDragger.classList.add('exscroll-dragger');
    var scrollTrack = document.createElement('div');
    scrollTrack.classList.add('exscroll-track');
    scrollTrack.appendChild(scrollDragger);
    scrollbar.appendChild(scrollTrack); // Set initial vars

    var isScrolling = false;
    var scrollStart = 0;
    var scrollPercent = 0;
    var elScrollWidth = el.scrollWidth;
    var elVisibleWidth = el.offsetWidth;
    var elVisiblePercentage = elVisibleWidth / elScrollWidth * 100;
    scrollDragger.style.cssText = "width:" + elVisiblePercentage + "%"; // Scrolling the scrollable container

    el.addEventListener("scroll", function (e) {
      if (!isScrolling) {
        scrollPercent = el.scrollLeft / (el.scrollWidth - el.offsetWidth) * (100 - elVisiblePercentage);
        scrollDragger.style.cssText += ";" + "left:" + scrollPercent + "%";
      }
    }); // Start scrolling the external scrollbar - touch

    container.addEventListener("mousedown", scrollStartHandler);
    scrollDragger.addEventListener("touchstart", scrollStartHandler);

    function scrollStartHandler(event) {
      isScrolling = true;
      scrollStart = event.touches ? event.touches[0].clientX : event.clientX;
    } // Stop scrolling the external scrollbar - touch


    document.addEventListener("mouseup", scrollUpHandler);
    container.addEventListener("touchend", scrollUpHandler);

    function scrollUpHandler() {
      if (isScrolling) {
        scrollPercent = el.scrollLeft / (el.scrollWidth - el.offsetWidth) * (100 - elVisiblePercentage);
        isScrolling = false;
      }
    } // Dragging the scroll element - touch


    document.addEventListener("mousemove", scrollMoveHandler);
    container.addEventListener("touchmove", scrollMoveHandler);

    function scrollMoveHandler(event) {
      if (isScrolling) {
        var scrollPos = event.touches ? event.touches[0].clientX : event.clientX;
        var scrollOffsetPercent = (scrollPos - scrollStart) / scrollTrack.offsetWidth * 100;

        if (scrollPercent + scrollOffsetPercent >= 0 && scrollPercent + scrollOffsetPercent <= 100 - elVisiblePercentage) {
          // While is inside container bounds
          scrollDragger.style.cssText += "; left: " + (scrollPercent + scrollOffsetPercent) + "%";
          el.scrollLeft = (scrollPercent + scrollOffsetPercent) / 100 * elScrollWidth;
        } else if (scrollPercent + scrollOffsetPercent < 0) {
          // If overextends to left
          scrollDragger.style.cssText += "; left: 0%";
          el.scrollLeft = 0;
        } else if (scrollPercent + scrollOffsetPercent > 100 - elVisiblePercentage) {
          // If overextends to right
          scrollDragger.style.cssText += "; left: " + (100 - elVisiblePercentage) + "%";
          el.scrollLeft = elScrollWidth;
        }
      }
    }
  });
}

if (typeof exports != "undefined") {
  module.exports.exScroll;
}