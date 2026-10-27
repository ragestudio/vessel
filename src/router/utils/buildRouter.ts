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
import { RootRoute } from "../context"

export interface RouterOptions {
	baseElement?: any
	routes: Partial<VesselRoute>[]
	declarations?: any[] | undefined
	staticRenders?: StaticRenders | undefined
	onPageMount?: ((context: any) => void) | undefined
	onPageUnmount?: (() => void) | undefined
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NullFallback = () => null

export function buildRouter({
	routes,
	declarations = [],
	staticRenders = {},
	onPageMount,
	onPageUnmount,
}: RouterOptions) {
	// find declarations
	const withDeclarations = routes.map((route) => {
		return {
			...route,
			declaration: findRouteDeclaration(route.path ?? "", declarations),
		}
	})

	// wrap routes
	const wrapped: any[] = withDeclarations.map((route) => {
		let routePath = route.path ?? ""

		if (route.declaration?.wildcard === true && !routePath.endsWith("*")) {
			routePath = routePath.endsWith("/") ? `${routePath}*` : `${routePath}/*`
		}

		return {
			path: routePath,
			ErrorBoundary: () =>
				React.createElement(staticRenders.RenderError ?? NullFallback, {
					// @ts-ignore
					error: useRouteError(),
				}),
			lazy: async () => {
				if (typeof route.import !== "function") return {}

				const mod = await route.import()

				return {
					loader: mod.default?.loader,
					shouldRevalidate: mod.default?.shouldRevalidate,
					Component: () =>
						React.createElement(PageWrapper, {
							path: route.path ?? "",
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

	wrapped.push({
		path: "*",
		element: React.createElement(staticRenders.NotFound ?? NullFallback),
	})

	const routesTree: RouteObject[] = [
		{
			path: "/",
			Component: RootRoute,
			children: wrapped,
		},
	]

	// create & return router
	if (isDesktop()) {
		return createHashRouter(routesTree)
	}

	return createBrowserRouter(routesTree)
}

export default buildRouter
