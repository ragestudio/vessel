import localforage from "localforage"

class ExtensionsDB {
	static dbName = "extensions"

	db = null

	async initialize() {
		this.db = await localforage.createInstance({
			name: ExtensionsDB.dbName,
			storeName: ExtensionsDB.dbName,
			driver: localforage.INDEXEDDB,
		})

		if (!(await this.db.getItem("manifests"))) {
			await this.db.setItem("manifests", {})
		}

		if (!(await this.db.getItem("data"))) {
			await this.db.setItem("data", [])
		}

		return this.db
	}

	manifest = {
		put: async (manifest) => {
			const manifests = await this.db.getItem("manifests")
			manifests[manifest.id] = manifest
			await this.db.setItem("manifests", manifests)
		},
		get: async (id) => {
			const manifests = await this.db.getItem("manifests")
			return manifests[id]
		},
		getAll: async () => {
			const manifests = await this.db.getItem("manifests")
			return Object.values(manifests)
		},
		delete: async (id) => {
			const manifests = await this.db.getItem("manifests")
			delete manifests[id]
			await this.db.setItem("manifests", manifests)
		},
	}
}

export default ExtensionsDB
