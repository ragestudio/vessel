import type EventBus from "./classes/EventBus"
import type ExtensionManager from "./extensions"

declare global {
	var app: {
		cores: Record<string, any>
		extensions: ExtensionManager
		eventBus: EventBus

		isMobile: boolean
		isDesktop: boolean
		__version: string

		[key: string]: any
	}
}

export {}
