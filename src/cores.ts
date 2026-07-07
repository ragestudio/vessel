import { Core } from "./core"
import { Runtime } from "./runtime"
import sortCoresByDependencies from "./utils/sortCoresByDependencies"

export class CoresManager extends Map {
	constructor(runtime: Runtime) {
		super()
		this.runtime = runtime
	}

	runtime: Runtime
	contexts: Record<string | symbol, any> = {}

	async scanCores(): Promise<(typeof Core)[]> {
		let cores = await this.runtime.adapter.scanCores()

		cores = cores.filter((mod) => !(cores instanceof Core))
		cores = cores.filter((mod) => !mod.disabled)
		cores = sortCoresByDependencies(cores)

		return cores
	}

	async initialize(): Promise<void> {
		this.runtime.console.time("runtime:initialize:cores")
		this.runtime.eventBus.emit("runtime.initialize.cores.start")

		try {
			this.runtime.console.time("runtime:initialize:cores:scan")
			const cores = await this.scanCores()
			this.runtime.console.timeEnd("runtime:initialize:cores:scan")

			if (!cores.length) {
				this.runtime.console.warn(
					`Cannot find any valid cores to initialize.`,
				)
				return
			}

			for (const core of cores) {
				await this.initializeCore(core)
			}

			this.runtime.eventBus.emit("runtime.initialize.cores.finish")
		} catch (error) {
			this.runtime.eventBus.emit("runtime.initialize.cores.failed", error)
			this.runtime.console.error(
				"Failed to initialize CoresManager:",
				error,
			)
			throw error
		}

		this.runtime.console.timeEnd("runtime:initialize:cores")
	}

	async initializeCore(coreClass: typeof Core) {
		if (!coreClass.constructor) {
			this.runtime.console.error(
				`Core [${coreClass.name}] is not a valid class`,
			)
			return false
		}

		const namespace = coreClass.namespace ?? coreClass.name
		this.runtime.eventBus.emit(`runtime.initialize.core.${namespace}.start`)

		const coreInstance = new coreClass(this.runtime)

		this.set(namespace, coreInstance)

		// reserve the context
		this.contexts[coreClass.namespace ?? coreClass.name] =
			Object.create(null)

		const initResult = await coreInstance._init()

		if (!initResult) {
			this.runtime.console.warn(
				`[${namespace}] core initialized without a result`,
			)
		}

		if (coreInstance.public) {
			this.contexts[namespace] = coreInstance.getPublicInterface()
		}

		// seal the context to prevent modifications
		Object.seal(this.contexts[namespace])

		this.runtime.console.debug(
			`[${namespace}] core initialized in ${coreInstance._initTooks}ms`,
		)

		this.runtime.eventBus.emit(
			`runtime.initialize.core.${namespace}.finish`,
		)

		return true
	}

	getPublicInterface() {
		return new Proxy(this.contexts, {
			get: (target, key) => target[key],
			set: () => {
				throw new Error("Cannot modify protected contexts")
			},
		})
	}
}

export default CoresManager
