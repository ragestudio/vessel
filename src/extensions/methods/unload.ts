import type { ExtensionsManager } from "../manager"

export default async function (this: ExtensionsManager, id: string) {
	let instance = this.get(id)

	if (!instance) {
		throw new Error(`Extension ${id} not found`)
	}

	try {
		await instance.main._unload()

		app.eventBus.emit("extension:unloaded", instance.manifest)
		this.logger.log(`Extension unloaded`, instance.manifest)
	} catch {
		this.logger.error(`Error unloading extension`, instance.manifest)
		return null
	}
}
