import type { StaticRenders } from "../types"

import React from "react"
import { RouterProvider, Outlet } from "react-router"

import buildRouter from "./utils/buildRouter"
import { generateRoutes } from "./utils/routeUtils"
import { RouterRootContext, RootRoute } from "./context"

export { RouterRootContext, RootRoute }

export type RenderProps = {
	children?: React.ReactNode
	routes?: any[]
	declarations?: any[]
	staticRenders?: StaticRenders
	onPageMount?: (ctx: any) => void
	onPageUnmount?: () => void
	renderEnabled?: boolean
}

export const Router = (
	props: RenderProps = {
		renderEnabled: true,
	},
) => {
	const router = React.useRef(
		buildRouter({
			routes: props.routes ?? generateRoutes(),
			declarations: props.declarations,
			staticRenders: props.staticRenders,
			onPageMount: props.onPageMount,
			onPageUnmount: props.onPageUnmount,
		}),
	)

	React.useEffect(() => {
		app.router = router.current

		// Emit initial navigation event
		const initialPath = app.isDesktop
			? router.current.state.location.pathname ||
				window.location.hash.replace("#", "")
			: router.current.state.location.pathname || window.location.pathname

		app.eventBus.emit("router.navigate", initialPath)
	}, [router.current])

	React.useEffect(() => {
		const unsubscribe = router.current.subscribe((state) => {
			const path = app.isDesktop
				? state.location.hash.replace("#", "") || state.location.pathname
				: state.location.pathname

			app.eventBus.emit("router.navigate", path)
		})

		const onHistoryChange = () => {
			if (app.isDesktop) {
				app.eventBus.emit(
					"router.navigate",
					window.location.hash.replace("#", ""),
				)
			} else {
				app.eventBus.emit("router.navigate", window.location.pathname)
			}
		}

		window.addEventListener("popstate", onHistoryChange)

		return () => {
			unsubscribe()
			window.removeEventListener("popstate", onHistoryChange)
		}
	}, [])

	return (
		<RouterRootContext.Provider value={{ children: props.children }}>
			{props.renderEnabled && <RouterProvider router={router.current} />}
		</RouterRootContext.Provider>
	)
}

export const Render = Outlet

export default Router
