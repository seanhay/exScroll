function exScroll(opts = {} as Object) {
	
	const defaultOptions = {
		wrapperName: '[exscroll]',
		contentName: '[exscroll-content]',
		scrollerName: '[exscroll-scrollbar]'
	}
	
	let options = {
		...defaultOptions,
		...opts
	}

	const containers = document.querySelectorAll(options.wrapperName)

	containers.forEach((container) => {
		const el = container.querySelector(options.contentName) as HTMLElement
		const scrollbar = container.querySelector(options.scrollerName) as HTMLElement

		// Add classes
		el.classList.add('exscroller-wrapper')
		scrollbar.classList.add('exscroller-scrollbar')

		// Structure constructor
		const scrollDragger = document.createElement('span')
		scrollDragger.classList.add('scroll-dragger')
		const scrollTrack = document.createElement('div')
		scrollTrack.classList.add('scroll-track')

		scrollTrack.appendChild(scrollDragger)
		scrollbar.appendChild(scrollTrack)

		// Set initial vars
		let isScrolling = false as boolean
		let scrollStart = 0 as number
		let scrollPercent = 0 as number

		let elScrollWidth = el.scrollWidth
		let elVisibleWidth = el.offsetWidth
		let elVisiblePercentage = (elVisibleWidth / elScrollWidth) * 100

		scrollDragger.style.cssText = "width:" + elVisiblePercentage + "%"

		// Scrolling the scrollable container
		el.addEventListener("scroll", function (e) {
			if (!isScrolling) {
				scrollPercent = (el.scrollLeft / (el.scrollWidth - el.offsetWidth)) * (100 - elVisiblePercentage)
				scrollDragger.style.cssText += ";" + "left:" + scrollPercent + "%"
			}
		});

		// Start scrolling the external scrollbar - touch
		container.addEventListener("mousedown", scrollStartHandler)
		scrollDragger.addEventListener("touchstart", scrollStartHandler)
		
		function scrollStartHandler(event:any){
			isScrolling = true;
			scrollStart = event.touches ? event.touches[0].clientX : event.clientX;
		}

		// Stop scrolling the external scrollbar - touch
		document.addEventListener("mouseup", scrollUpHandler)
		container.addEventListener("touchend", scrollUpHandler)
		
		function scrollUpHandler(){
			if(isScrolling){
				scrollPercent = (el.scrollLeft / (el.scrollWidth - el.offsetWidth)) * (100 - elVisiblePercentage)
				isScrolling = false
			}
		}

		// Dragging the scroll element - touch
		document.addEventListener("mousemove", scrollMoveHandler)
		container.addEventListener("touchmove", scrollMoveHandler)
		
		function scrollMoveHandler(event:any){
			if (isScrolling) {
				let scrollPos = event.touches ? event.touches[0].clientX : event.clientX
				let scrollOffsetPercent = ((scrollPos - scrollStart) / scrollTrack.offsetWidth) * 100

				if (scrollPercent + scrollOffsetPercent >= 0 && scrollPercent + scrollOffsetPercent <= 100 - elVisiblePercentage) {
					// While is inside container bounds
					scrollDragger.style.cssText += "; left: " + (scrollPercent + scrollOffsetPercent) + "%"
					el.scrollLeft = ((scrollPercent + scrollOffsetPercent) / 100) * elScrollWidth
				} else if (scrollPercent + scrollOffsetPercent < 0) {
					// If overextends to left
					scrollDragger.style.cssText += "; left: 0%"
					el.scrollLeft = 0;
				} else if (scrollPercent + scrollOffsetPercent > 100 - elVisiblePercentage) {
					// If overextends to right
					scrollDragger.style.cssText += "; left: " + (100 - elVisiblePercentage) + "%"
					el.scrollLeft = elScrollWidth
				}
			}
		}
	})
}

export default exScroll