import React from "react"
import { RouterProvider } from "react-router"

import buildRouter from "./utils/buildRouter"
import { generateRoutes } from "./utils/routeUtils"

export const LocationMethods = {
	push: (to, state = {}) => {
		// Clean double slashes
		to = to.replace(/\/{2,}/g, "/")

		// push to history state and dispatch event
		window.history.pushState(state, null, to)
		window.dispatchEvent(new Event("popstate"))
	},
	back: () => {
		window.history.back()
	},
}

export const Render = (props = {}) => {
	const router = React.useRef(
		buildRouter({
			routes: generateRoutes(props.routes),
			declarations: props.declarations,
			staticRenders: props.staticRenders,
			onPageMount: props.onPageMount,
			onPageUnmount: props.onPageUnmount,
		}),
	)

	const onHistoryChange = React.useCallback(() => {
		app.eventBus.emit("router.navigate", window.location.pathname)
	}, [])

	React.useEffect(() => {
		app.router = router.current
		app.location = LocationMethods
	}, [router.current])

	React.useEffect(() => {
		window.addEventListener("popstate", onHistoryChange)

		return () => {
			window.removeEventListener("popstate", onHistoryChange)
		}
	}, [])

	return <RouterProvider router={router.current} />
}
