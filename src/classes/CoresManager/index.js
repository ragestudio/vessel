import sortCoresByDependencies from "../../utils/sortCoresByDependencies"

export default class CoresManager {
	constructor(runtime) {
		this.runtime = runtime
	}

	cores = new Map()

	context = Object()

	async initialize() {
		try {
			const coresPaths = {
				...import.meta.glob("/src/cores/*/*.core.jsx"),
				...import.meta.glob("/src/cores/*/*.core.js"),
				...import.meta.glob("/src/cores/*/*.core.ts"),
				...import.meta.glob("/src/cores/*/*.core.tsx"),
			}

			const coresKeys = Object.keys(coresPaths)

			if (coresKeys.length === 0) {
				this.runtime.console.warn(
					"Cannot find any cores to initialize.",
				)
				return true
			}

			let cores = await Promise.all(
				coresKeys.map(async (key) => {
					const coreModule = await coresPaths[key]().catch((err) => {
						this.runtime.console.warn(
							`Cannot load core [${key}]`,
							err,
						)
						return false
					})
					return coreModule?.default ?? coreModule
				}),
			)

			cores = cores.filter((core) => core && core.constructor)

			if (!cores.length) {
				this.console.warn(`Cannot find any valid cores to initialize.`)
				return true
			}

			this.runtime.eventBus.emit("runtime.initialize.cores.start")

			cores = sortCoresByDependencies(cores)

			for (const coreClass of cores) {
				await this.initializeCore(coreClass)
			}

			this.runtime.eventBus.emit("runtime.initialize.cores.finish")
		} catch (error) {
			this.runtime.eventBus.emit("runtime.initialize.cores.failed", error)
			throw error
		}
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

		const result = await coreInstance._init()

		if (!result) {
			this.runtime.console.warn(
				`[${namespace}] core initialized without a result`,
			)
		}

		if (result.public_context) {
			this.context[result.namespace] = result.public_context
		}

		this.runtime.eventBus.emit(
			`runtime.initialize.core.${namespace}.finish`,
		)
		//this.states.LOADED_CORES.push(namespace)

		return true
	}

	getCoreContext = () => {
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
