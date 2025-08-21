export default class Location {
	static push(to, state = {}) {
		// Clean double slashes
		to = to.replace(/\/{2,}/g, "/")

		if (app.isDesktop === true) {
			// Use hash routing for desktop
			window.location.hash = to
		} else {
			// push to history state and dispatch event
			window.history.pushState(state, null, to)
			window.dispatchEvent(new Event("popstate"))
		}
	}

	static back() {
		window.history.back()
	}

	static get pathname() {
		if (app.isDesktop === true) {
			return window.location.hash.replace("#", "")
		}

		return window.location.pathname
	}
}
