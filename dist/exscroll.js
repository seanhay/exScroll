"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function exScroll(opts) {
    if (opts === void 0) { opts = {}; }
    var defaultOptions = {
        wrapperName: '[exscroll]',
        contentName: '[exscroll-content]',
        scrollerName: '[exscroll-scrollbar]'
    };
    var options = __assign(__assign({}, defaultOptions), opts);
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
        var elVisiblePercentage = (elVisibleWidth / elScrollWidth) * 100;
        scrollDragger.style.cssText = "width:" + elVisiblePercentage + "%";
        // Scrolling the scrollable container
        el.addEventListener("scroll", function (e) {
            if (!isScrolling) {
                scrollPercent = (el.scrollLeft / (el.scrollWidth - el.offsetWidth)) * (100 - elVisiblePercentage);
                scrollDragger.style.cssText += ";" + "left:" + scrollPercent + "%";
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
                scrollPercent = (el.scrollLeft / (el.scrollWidth - el.offsetWidth)) * (100 - elVisiblePercentage);
                isScrolling = false;
            }
        }
        // Dragging the scroll element - touch
        document.addEventListener("mousemove", scrollMoveHandler);
        container.addEventListener("touchmove", scrollMoveHandler);
        function scrollMoveHandler(event) {
            if (isScrolling) {
                var scrollPos = event.touches ? event.touches[0].clientX : event.clientX;
                var scrollOffsetPercent = ((scrollPos - scrollStart) / scrollTrack.offsetWidth) * 100;
                if (scrollPercent + scrollOffsetPercent >= 0 && scrollPercent + scrollOffsetPercent <= 100 - elVisiblePercentage) {
                    // While is inside container bounds
                    scrollDragger.style.cssText += "; left: " + (scrollPercent + scrollOffsetPercent) + "%";
                    el.scrollLeft = ((scrollPercent + scrollOffsetPercent) / 100) * elScrollWidth;
                }
                else if (scrollPercent + scrollOffsetPercent < 0) {
                    // If overextends to left
                    scrollDragger.style.cssText += "; left: 0%";
                    el.scrollLeft = 0;
                }
                else if (scrollPercent + scrollOffsetPercent > 100 - elVisiblePercentage) {
                    // If overextends to right
                    scrollDragger.style.cssText += "; left: " + (100 - elVisiblePercentage) + "%";
                    el.scrollLeft = elScrollWidth;
                }
            }
        }
    });
}
