import type { StaticRenders, VesselRoute } from "../../types"
import type { RouteObject } from "react-router"

import React from "react"
import {
	createBrowserRouter,
	createHashRouter,
	useRouteError,
} from "react-router"
import isDesktop from "../../utils/isDesktop"

import PageWrapper from "../components/PageWrapper"
import { findRouteDeclaration } from "./routeUtils"

export interface RouterOptions {
	routes: Partial<VesselRoute>[]
	declarations: any[]
	staticRenders?: StaticRenders
	onPageMount?: Function
	onPageUnmount?: Function
}

export function buildRouter({
	routes,
	declarations,
	staticRenders = {},
	onPageMount,
	onPageUnmount,
}: RouterOptions) {
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

		return {
			path: route.path,
			ErrorBoundary: () =>
				React.createElement(staticRenders.RenderError, {
					// @ts-ignore
					error: useRouteError(),
				}),
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
		return createHashRouter(routes as RouteObject[])
	}

	return createBrowserRouter(routes as RouteObject[])
}

export default buildRouter
