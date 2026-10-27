export default class Location {
	static push(to: string, state = {}) {
		// Clean double slashes
		to = to.replace(/\/{2,}/g, "/")

		if (window.app?.router?.navigate) {
			return window.app.router.navigate(to, { state })
		}

		if (window.app.isDesktop === true) {
			// Use hash routing for desktop
			window.location.hash = to
			window.dispatchEvent(new Event("popstate"))
		} else {
			// push to history state and dispatch event
			window.history.pushState(state, "", to)
			window.dispatchEvent(new Event("popstate"))
		}
	}

	static replace(to: string, state = {}) {
		// Clean double slashes
		to = to.replace(/\/{2,}/g, "/")

		if (window.app?.router?.navigate) {
			return window.app.router.navigate(to, { replace: true, state })
		}

		if (window.app.isDesktop === true) {
			// Use hash routing for desktop
			window.location.hash = to
			window.dispatchEvent(new Event("popstate"))
		} else {
			// replace history state and dispatch event
			window.history.replaceState(state, "", to)
			window.dispatchEvent(new Event("popstate"))
		}
	}

	static back() {
		if (window.app?.router?.navigate) {
			return window.app.router.navigate(-1)
		}

		window.history.back()
	}

	static get pathname() {
		if (window.app?.router?.state?.location?.pathname) {
			return window.app.router.state.location.pathname
		}

		if (window.app.isDesktop === true) {
			return window.location.hash.replace("#", "")
		}

		return window.location.pathname
	}
}
