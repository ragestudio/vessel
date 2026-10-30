import type { ExtensionsManager } from "../manager"
import type { ExtensionManifest } from "../types"

export default async function (this: ExtensionsManager) {
	if (app.isDesktop) {
		if (globalThis.ipcRenderer.on) {
			globalThis.ipcRenderer.on(
				"extensions:load",
				(_event: any, manifest: ExtensionManifest) => {
					this.logger.log(
						"Load extension received from IPC:",
						manifest,
					)
					this.load(manifest)
				},
			)
		}

		const response = await fetch("http://localhost:11150/extensions/list")

		if (response.ok) {
			const manifests =
				(await response.json()) as unknown as ExtensionManifest[]

			for (let manifest of manifests) {
				this.load(manifest)
			}
		}
	}

	await this.db.initialize()

	// load all extensions
	// TODO: load this to late app initializer to avoid waiting for extensions to load the app
	let extensions = (await this.db.manifest.getAll()) as ExtensionManifest[]

	for (let extension of extensions) {
		try {
			await this.load(extension)
		} catch (error) {
			this.logger.error(`Error loading extension ${extension.id}:`, error)
		}
	}
}
