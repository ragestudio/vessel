import type { Adapter } from "./adapter"

import CoresManager from "./cores"
import ExtensionManager from "./extensions"

import EventBus from "./classes/EventBus"
import InternalConsole from "./classes/InternalConsole"
import Tasks from "./classes/Tasks"
import bindObjects from "./utils/bindObjects"
import isMobile from "./utils/isMobile"
import isDesktop from "./utils/isDesktop"

import pkgJson from "../package.json"

export interface VesselApp {
	events?: Record<string, (...args: any[]) => void>
	splashAwaitEvent?: string
	initialize?: () => Promise<void>
	publicEvents?: Record<string, any>
	publicMethods?: Record<string, any>
	render?: (children: any) => any
}

export class Runtime {
	constructor(baseAppClass?: VesselApp, adapter?: typeof Adapter) {
		if (!adapter) {
			throw new Error("adapter is required")
		}

		this.adapter = new adapter(this)
		this.adapter._connect_runtime(this)

		if (baseAppClass) {
			this.baseAppClass = baseAppClass
			this.registerBaseClass(baseAppClass)
		}

		this.initialize()
	}

	adapter: Adapter

	cores: CoresManager = new CoresManager(this)
	extensions: ExtensionManager = new ExtensionManager(this)
	eventBus: EventBus = new EventBus()
	console: InternalConsole = new InternalConsole({
		namespace: "runtime",
	})
	initializer: Tasks = new Tasks()
	publicContext: Record<string | symbol, any> = {}

	baseAppClass!: VesselApp

	async registerBaseClass(baseAppClass: VesselApp) {
		if (!baseAppClass.constructor) {
			throw new Error("baseAppClass must be a class")
		}

		this.baseAppClass = baseAppClass

		if (typeof this.baseAppClass.events === "object") {
			for (const [event, handler] of Object.entries(
				this.baseAppClass.events,
			)) {
				this.eventBus.on(event, (...args) => handler(this, ...args))
			}
		}

		if (typeof this.baseAppClass.publicEvents === "object") {
			for (const [event, handler] of Object.entries(
				this.baseAppClass.publicEvents,
			)) {
				this.eventBus.on(event, handler.bind(this))
			}
		}

		if (typeof this.baseAppClass.publicMethods === "object") {
			const boundedPublicMethods = bindObjects(
				this,
				this.baseAppClass.publicMethods,
			)

			for (const [methodName, fn] of Object.entries(
				boundedPublicMethods,
			)) {
				this.registerPublicField(methodName, fn)
			}
		}

		if (this.baseAppClass.splashAwaitEvent) {
			this.eventBus.on(this.baseAppClass.splashAwaitEvent, () =>
				this.adapter.splash.detach(),
			)
		}
	}

	internalEvents = {
		"runtime.initialize.cores.finish": async () => {
			if (
				this.baseAppClass &&
				typeof this.baseAppClass.initialize === "function"
			) {
				await this.baseAppClass.initialize.call(this)
			}
		},
		"runtime.initialize.finish": () => {
			if (!this.baseAppClass || !this.baseAppClass.splashAwaitEvent) {
				this.adapter.splash.detach()
			}

			if (typeof this.adapter.finishInit === "function") {
				this.adapter.finishInit()
			}
		},
	}

	async initialize() {
		// Define the app global
		Object.defineProperties(globalThis, {
			app: {
				value: this.publicContext,
				enumerable: true,
			},
		})

		this.eventBus.emit("runtime.initialize.start")
		this.console.time("runtime:initialize")

		if (typeof this.adapter.startInit === "function") {
			await this.adapter.startInit()
		}

		this.adapter.splash.attach()

		// register internal events
		for (const [event, handler] of Object.entries(this.internalEvents)) {
			this.eventBus.on(event, handler)
		}

		this.registerPublicField("cores", this.cores.getPublicInterface())
		this.registerPublicField("extensions", this.extensions)
		this.registerPublicField("eventBus", this.eventBus)
		this.registerPublicField("isMobile", isMobile())
		this.registerPublicField("isDesktop", isDesktop())
		this.registerPublicField("__version", pkgJson.version)

		await this.cores.initialize()

		this.console.timeEnd("runtime:initialize")
		this.eventBus.emit("runtime.initialize.finish")

		// initialize extension manager
		this.extensions.initialize()

		// do pending initializer tasks
		this.console.time("runtime:performInitializerTasks")
		await this.initializer.run()
		this.console.timeEnd("runtime:performInitializerTasks")
	}

	registerPublicField(key: string | symbol, value: any, ...args: any[]) {
		if (args.length > 0) {
			value = value(...args)
		}

		try {
			Object.defineProperty(this.publicContext, key, {
				get: () => value,
				set: () => {
					throw new Error("Cannot set value of public field")
				},
				enumerable: true,
				//configurable: true,
			})
		} catch (error) {
			this.console.error(error)
		}

		return this.publicContext[key]
	}
}

export default Runtime
