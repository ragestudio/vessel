import React from "react"
import {
	createBrowserRouter,
	createHashRouter,
	useRouteError,
} from "react-router"
import isDesktop from "../../utils/isDesktop"

import PageWrapper from "../components/PageWrapper"
import { findRouteDeclaration } from "./routeUtils"

export function buildRouter({
	routes,
	declarations,
	staticRenders = {},
	onPageMount,
	onPageUnmount,
}) {
	// find declarations
	routes = routes.map((route) => {
		return {
			...route,
			declaration: findRouteDeclaration(route.path, declarations),
		}
	})

	// wrap routes
	routes = routes.map((route) => {
		if (route.declaration.wildcard === true) {
			route.path = `${route.path}*`
		}

		const RouteErrorBoundary = () =>
			React.createElement(staticRenders.RenderError, {
				error: useRouteError(),
			})

		return {
			path: route.path,
			ErrorBoundary: RouteErrorBoundary,
			lazy: async () => {
				const mod = await route.import()

				return {
					loader: mod.default.loader,
					shouldRevalidate: mod.default.shouldRevalidate,
					Component: () =>
						React.createElement(PageWrapper, {
							path: route.path,
							element: mod.default,
							declaration: route.declaration,
							loadFallback: staticRenders.Loading,
							onMount: onPageMount,
							onUnmount: onPageUnmount,
						}),
				}
			},
		}
	})

	routes.push({
		path: "*",
		element: React.createElement(staticRenders.NotFound),
	})

	// create & return router
	if (isDesktop()) {
		return createHashRouter(routes)
	}

	return createBrowserRouter(routes)
}

export default buildRouter
