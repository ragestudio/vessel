import type { ExtensionsManager } from "../manager"

export default async function (this: ExtensionsManager, id: string) {
	let manifest = await this.db.manifest.get(id)

	if (!manifest) {
		throw new Error(`Extension ${id} not found`)
	}

	return this.load(manifest)
}
