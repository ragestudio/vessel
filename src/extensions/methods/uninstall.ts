import type { ExtensionsManager } from "../manager"

export default async function (this: ExtensionsManager, id: string) {
	const manifest = await this.db.manifest.get(id)

	if (!manifest) {
		throw new Error(`Extension [${id}] not found in manifests`)
	}

	app.eventBus.emit("extension:uninstalling", manifest)
	this.logger.log(`Uninstalling extension`, manifest)

	let extension = this.get(id)

	if (extension) {
		await this.unload(id)
	}

	await this.db.manifest.delete(id)
	this.delete(id)

	app.eventBus.emit("extension:uninstalled", manifest)
	this.logger.log(`Extension uninstalled`, manifest)
}
