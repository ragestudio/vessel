import type { RouteObject } from "react-router"

export interface VesselApp {
	events?: Record<string, (...args: any[]) => void>
	splashAwaitEvent?: string
	initialize?: () => Promise<void>
	publicEvents?: Record<string, any>
	publicMethods?: Record<string, any>
	render?: (children: any) => any
}

export type VesselPage = {
	loader?: () => Promise<any>
	shouldRevalidate?: () => boolean
} & React.ComponentType

export type VesselRoute = {
	import: () => Promise<{ default: VesselPage }>
	declaration?: Record<string, any>
} & RouteObject

export interface StaticRenders {
	Loading?: React.ComponentType
	NotFound?: React.ComponentType
	RenderError?: React.ComponentType
}
