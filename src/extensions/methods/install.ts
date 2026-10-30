import type { ExtensionsManager } from "../manager"

import { isUrl, replaceRelativeImportWithUrl } from "../../utils/url"

export default async function (this: ExtensionsManager, manifestUrl: string) {
	if (app.isDesktop) {
		return await globalThis.ipcRenderer.invoke(
			"extensions:install",
			manifestUrl,
		)
	}

	let manifest: any = null

	if (isUrl(manifestUrl)) {
		const response = await fetch(manifestUrl)
		manifest = await response.json()
	}

	app.eventBus.emit("extension:installing", manifest)
	this.logger.log(`Installing extension`, manifest)

	if (!manifest.main) {
		throw new Error("Extension manifest is missing main file")
	}

	manifest.id = manifest.name.replace("/", "-").replace("@", "")
	manifest.url = manifestUrl
	manifest.main = replaceRelativeImportWithUrl(manifest.main, manifestUrl)
	manifest.enabled = true
	manifest.installed_at = Date.now()

	await this.db.manifest.put(manifest)
	await this.loadById(manifest.id)

	app.eventBus.emit("extension:installed", manifest)
	this.logger.log(`Extension installed`, manifest)
}
