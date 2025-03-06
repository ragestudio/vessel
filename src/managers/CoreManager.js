export default class CoreManager {
	constructor(runtime) {
		this.runtime = runtime
		this.cores = new Map()
	}

	async initializeCores() {
		const coreModules = await this.discoverCoreModules()
		const sortedCores = DependencyResolver.resolveDependencies(coreModules)

		for (const CoreClass of sortedCores) {
			try {
				const coreInstance = new CoreClass(this.runtime)
				await coreInstance.initialize()
				this.registerCore(CoreClass, coreInstance)
			} catch (error) {
				this.runtime.console.error(
					`Core ${CoreClass.name} failed:`,
					error,
				)
				throw error
			}
		}
	}

	registerCore(CoreClass, instance) {
		this.cores.set(CoreClass.name, instance)
		this.runtime.contextManager.registerCore(CoreClass.name, instance)
	}
}
