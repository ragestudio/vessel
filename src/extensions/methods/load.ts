import type { ExtensionsManager } from "../manager"

import { ExtensionManifest } from "../types"

export default async function (
	this: ExtensionsManager,
	manifest: ExtensionManifest,
) {
	app.eventBus.emit("extension:loading", manifest)
	this.logger.log(`Loading extension`, manifest)

	if (!manifest.main) {
		throw new Error("Extension manifest is missing main file")
	}

	// check if is already loaded
	if (this.has(manifest.id)) {
		this.logger.warn(
			`Extension [${manifest.id}] is already loaded, unloading...`,
		)
		await this.unload(manifest.id)
	}

	let main: any = null
	const startLoadAt = performance.now()
	const importUrl =
		(manifest.remoteMain ?? manifest.main) + "?t=" + Date.now()

	if (manifest.enabled === true) {
		// @ts-ignore
		let mainClass = await import(
			/* @vite-ignore */
			importUrl
		)

		mainClass = mainClass.default

		// initializate
		main = new mainClass(this.runtime, manifest)

		await main._init()
	}

	const loadDuration = performance.now() - startLoadAt

	// set extension in map
	this.set(manifest.id, {
		id: manifest.id,
		manifest: manifest,
		main: main,
		worker: null,
		loadDuration: loadDuration,
		enabled: manifest.enabled,
		runtimed: manifest.runtimed,
	})

	app.eventBus.emit("extension:loaded", manifest)
	this.logger.log(`Extension loaded`, manifest)
}
