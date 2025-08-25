import sortCoresByDependencies from "../../utils/sortCoresByDependencies"

export default class CoresManager {
	constructor(runtime) {
		this.runtime = runtime
	}

	cores = new Map()

	context = Object()

	async initialize() {
		this.runtime.console.time("runtime:initialize:cores")

		try {
			this.runtime.console.time("runtime:initialize:cores:importpaths")
			const coresPaths = import.meta.glob(
				[
					"/src/cores/*/*.core.jsx",
					"/src/cores/*/*.core.js",
					"/src/cores/*/*.core.ts",
					"/src/cores/*/*.core.tsx",
				],
				{ eager: true },
			)
			this.runtime.console.timeEnd("runtime:initialize:cores:importpaths")

			let cores = Object.values(coresPaths).map((mod) => {
				return mod.default
			})

			this.runtime.console.time("runtime:initialize:cores:filters")
			// filter by valid cores
			cores = cores.filter((core) => core && core.constructor)

			// filter by disabled cores
			cores = cores.filter((core) => {
				return !core.disabled
			})

			this.runtime.console.timeEnd("runtime:initialize:cores:filters")

			if (!cores.length) {
				this.runtime.console.warn(
					`Cannot find any valid cores to initialize.`,
				)
				return true
			}

			this.runtime.eventBus.emit("runtime.initialize.cores.start")

			this.runtime.console.time("runtime:initialize:cores:sort")
			cores = sortCoresByDependencies(cores)
			this.runtime.console.timeEnd("runtime:initialize:cores:sort")

			this.runtime.console.time("runtime:initialize:cores:init")
			for (const coreClass of cores) {
				await this.initializeCore(coreClass)
			}
			this.runtime.console.timeEnd("runtime:initialize:cores:init")

			this.runtime.eventBus.emit("runtime.initialize.cores.finish")
		} catch (error) {
			this.runtime.eventBus.emit("runtime.initialize.cores.failed", error)
			throw error
		}

		this.runtime.console.timeEnd("runtime:initialize:cores")
	}

	async initializeCore(coreClass) {
		if (!coreClass.constructor) {
			this.runtime.console.error(
				`Core [${coreClass.name}] is not a valid class`,
			)
			return false
		}

		const namespace = coreClass.namespace ?? coreClass.name
		this.runtime.eventBus.emit(`runtime.initialize.core.${namespace}.start`)

		const coreInstance = new coreClass(this.runtime)

		this.cores.set(namespace, coreInstance)

		const initResult = await coreInstance._init()

		if (!initResult) {
			this.runtime.console.warn(
				`[${namespace}] core initialized without a result`,
			)
		}

		if (initResult.public_context) {
			this.context[initResult.namespace] = initResult.public_context
		}

		this.runtime.console.debug(
			`[${namespace}] core initialized in ${coreInstance._initTooks}ms`,
		)

		this.runtime.eventBus.emit(
			`runtime.initialize.core.${namespace}.finish`,
		)
		//this.states.LOADED_CORES.push(namespace)

		return true
	}

	getContext = () => {
		return new Proxy(this.context, {
			get: (target, key) => target[key],
			set: () => {
				throw new Error("Cannot modify the runtime property")
			},
		})
	}

	get = (key) => {
		return this.cores.get(key)
	}
}
