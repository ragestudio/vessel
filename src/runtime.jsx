import pkgJson from "../package.json"

import "./patches"

import React from "react"
window.React = React
import { createRoot } from "react-dom/client"

import { Observable } from "object-observer"

import CoresManager from "./classes/CoresManager"
import ExtensionManager from "./classes/ExtensionsManager"
import EventBus from "./classes/EventBus"
import InternalConsole from "./classes/InternalConsole"
import SplashScreenManager from "./classes/SplashScreenManager"

import bindObjects from "./utils/bindObjects"
import isMobile from "./utils/isMobile"
import isDesktop from "./utils/isDesktop"

import * as StaticRenders from "./internals/renders"
import "./internals/style/index.css"

export default class Runtime {
	constructor(baseAppClass, params = { renderMount: "root" }) {
		this.baseAppClass = baseAppClass
		this.params = params

		this.initialize().catch((error) => {
			this.eventBus.emit("runtime.initialize.crash", error)
		})
	}

	// contexts & managers
	publicContext = (window.app = {})
	cores = new CoresManager(this)
	extensions = new ExtensionManager(this)
	splash = new SplashScreenManager()

	flags = Observable.from({
		debug: false,
	})
	console = new InternalConsole({
		namespace: "Runtime",
		bgColor: "bgMagenta",
	})
	eventBus = new EventBus({
		id: "runtime",
	})

	states = Observable.from({
		LOAD_STATE: "early",
		INITIALIZER_TASKS: [],
		INITIALIZATION_START: null,
		INITIALIZATION_STOP: null,
		INITIALIZATION_TOOKS: null,
	})

	internalEvents = {
		"runtime.initialize.start": () => {
			this.states.LOAD_STATE = "initializing"
			this.states.INITIALIZATION_START = performance.now()
		},
		"runtime.initialize.finish": () => {
			const time = performance.now()
			this.states.INITIALIZATION_STOP = time
			if (this.states.INITIALIZATION_START) {
				this.states.INITIALIZATION_TOOKS =
					time - this.states.INITIALIZATION_START
			}
			this.states.LOAD_STATE = "initialized"
		},
		"runtime.initialize.crash": (error) => {
			this.states.LOAD_STATE = "crashed"
			this.splash.detach()
			this.console.error("Runtime crashed on initialization\n", error)
			this.render(
				this.baseAppClass.staticRenders?.Crash ?? StaticRenders.Crash,
				{
					crash: {
						message: "Runtime crashed on initialization",
						details: error.toString(),
					},
				},
			)
		},
		"runtime.crash": (crash) => {
			this.states.LOAD_STATE = "crashed"
			this.splash.detach()
			this.render(
				this.baseAppClass.staticRenders?.Crash ?? StaticRenders.Crash,
				{ crash },
			)
		},
	}

	registerEventsToBus(eventsObj) {
		for (const [event, handler] of Object.entries(eventsObj)) {
			this.eventBus.on(event, handler.bind(this))
		}
	}

	async initialize() {
		this.eventBus.emit("runtime.initialize.start")
		this.console.time("runtime:initialize")

		this.console.log(
			`Using React ${React.version} | Runtime v${pkgJson.version}`,
		)

		this.splash.attach()

		this.root = createRoot(
			document.getElementById(this.params.renderMount ?? "root"),
		)

		this.registerPublicField("eventBus", this.eventBus)
		this.registerPublicField("isMobile", isMobile())
		this.registerPublicField("isDesktop", isDesktop())
		this.registerPublicField("__version", pkgJson.version)

		// create fake process
		window.process = {
			env: {},
		}

		window.app.cores = this.cores.getContext()
		window.app.extensions = this.extensions

		this.registerEventsToBus(this.internalEvents)

		if (typeof this.baseAppClass.events === "object") {
			for (const [event, handler] of Object.entries(
				this.baseAppClass.events,
			)) {
				this.eventBus.on(event, (...args) => handler(this, ...args))
			}
		}

		if (this.baseAppClass.splashAwaitEvent) {
			this.eventBus.on(this.baseAppClass.splashAwaitEvent, () => {
				this.splash.detach()
			})
		}

		await this.cores.initialize()
		await this.performInitializerTasks()

		if (typeof this.baseAppClass.initialize === "function") {
			await this.baseAppClass.initialize.call(this)
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
				this.registerPublicField({ key: methodName, locked: true }, fn)
			}
		}

		this.eventBus.emit("runtime.initialize.finish")
		this.render(this.baseAppClass)

		// initialize extension manager
		this.extensions.initialize()

		if (!this.baseAppClass.splashAwaitEvent) {
			this.splash.detach()
		}

		this.console.timeEnd("runtime:initialize")
	}

	appendToInitializer(task) {
		let tasks = Array.isArray(task) ? task : [task]
		tasks.forEach((_task) => {
			if (typeof _task === "function") {
				this.states.INITIALIZER_TASKS.push(_task)
			}
		})
	}

	async performInitializerTasks() {
		if (this.states.INITIALIZER_TASKS.length === 0) {
			this.console.warn("Cannot find any initializer tasks, skipping...")
			return true
		}

		for (const task of this.states.INITIALIZER_TASKS) {
			if (typeof task === "function") {
				try {
					await task(this)
				} catch (error) {
					this.console.error("Error in initializer task:", error)
				}
			}
		}
	}

	registerPublicField = (params = {}, value, ...args) => {
		const opts = {
			key: typeof params === "string" ? params : params.key,
			locked: params.locked ?? false,
			enumerable: params.enumerable ?? true,
		}
		if (typeof opts.key === "undefined") {
			throw new Error("a key is required")
		}
		if (args.length > 0) {
			value = value(...args)
		}
		try {
			Object.defineProperty(this.publicContext, opts.key, {
				value,
				enumerable: opts.enumerable,
				configurable: opts.locked,
			})
		} catch (error) {
			this.console.error(error)
		}
		return this.publicContext[opts.key]
	}

	render(component, props = {}) {
		const renderer = React.createElement(component, {
			runtime: this,
			...props,
		})

		this.root.render(renderer)
	}

	getRuntimeStatus() {
		return {
			state: this.states.LOAD_STATE,
			initializationDuration: this.states.INITIALIZATION_TOOKS,
			loadedCores: this.states.LOADED_CORES,
			attachedExtensions: this.states.ATTACHED_EXTENSIONS,
			rejectedExtensions: this.states.REJECTED_EXTENSIONS,
		}
	}
}
