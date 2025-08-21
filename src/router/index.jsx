import React from "react"
import { RouterProvider } from "react-router"

import buildRouter from "./utils/buildRouter"
import { generateRoutes } from "./utils/routeUtils"

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
		if (app.isDesktop) {
			// Use hash routing for desktop
			app.eventBus.emit(
				"router.navigate",
				window.location.hash.replace("#", ""),
			)
		} else {
			app.eventBus.emit("router.navigate", window.location.pathname)
		}
	}, [])

	React.useEffect(() => {
		app.router = router.current
	}, [router.current])

	React.useEffect(() => {
		window.addEventListener("popstate", onHistoryChange)

		return () => {
			window.removeEventListener("popstate", onHistoryChange)
		}
	}, [])

	return <RouterProvider router={router.current} />
}
