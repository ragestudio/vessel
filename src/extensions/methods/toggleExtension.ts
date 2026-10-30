import type { ExtensionsManager } from "../manager"

export default async function (
	this: ExtensionsManager,
	id: string,
	to?: boolean,
) {
	let extension = this.get(id)

	if (!extension) {
		throw new Error(`Extension ${id} not found`)
	}

	if (typeof to !== "boolean") {
		to = !extension.enabled
	}

	extension.manifest.enabled = to
	extension.enabled = to

	await this.db.manifest.put(extension.manifest)
	this.set(id, extension)

	if (extension.manifest.enabled) {
		await this.load(extension.manifest)
	} else {
		await this.unload(extension.manifest.id)
	}
}
