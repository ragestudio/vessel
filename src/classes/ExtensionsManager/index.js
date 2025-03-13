import InternalConsole from "../InternalConsole"
import { isUrl } from "../../utils/url"
import replaceRelativeImportWithUrl from "../../utils/replaceRelativeImportWithUrl"
import ExtensionsDB from "./db"

export default class ExtensionManager {
	constructor(runtime) {
		this.runtime = runtime
	}

	logger = new InternalConsole({
		namespace: "ExtensionsManager",
		bgColor: "bgMagenta",
	})

	extensions = new Map()

	db = new ExtensionsDB()

	context = Object()

	load = async (id) => {
		let manifest = await this.db.manifest.get(id)

		if (!manifest) {
			throw new Error(`Extension ${id} not found`)
		}

		this.runtime.eventBus.emit("extension:loading", manifest)
		this.logger.log(`Loading extension`, manifest)

		if (!manifest.main) {
			throw new Error("Extension manifest is missing main file")
		}

		// load main file
		let mainClass = await import(
			/* @vite-ignore */
			manifest.main
		)

		// inject dependencies
		mainClass = mainClass.default

		// initializate
		let main = new mainClass(this.runtime, this, manifest)

		await main._init()

		// set extension in map
		this.extensions.set(manifest.id, {
			manifest: manifest,
			main: main,
			worker: null,
		})

		this.runtime.eventBus.emit("extension:loaded", manifest)
		this.logger.log(`Extension loaded`, manifest)
	}

	unload = async (id) => {
		let extension = this.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension ${id} not found`)
		}

		await extension.main._unload()

		this.extensions.delete(id)

		this.runtime.eventBus.emit("extension:unloaded", extension.manifest)
		this.logger.log(`Extension unloaded`, extension.manifest)
	}

	install = async (manifestUrl) => {
		let manifest = null

		if (isUrl(manifestUrl)) {
			manifest = await fetch(manifestUrl)
			manifest = await manifest.json()
		}

		this.runtime.eventBus.emit("extension:installing", manifest)
		this.logger.log(`Installing extension`, manifest)

		if (!manifest.main) {
			throw new Error("Extension manifest is missing main file")
		}

		manifest.id = manifest.name.replace("/", "-").replace("@", "")
		manifest.url = manifestUrl
		manifest.main = replaceRelativeImportWithUrl(manifest.main, manifestUrl)

		await this.db.manifest.put(manifest)
		await this.load(manifest.id)

		this.runtime.eventBus.emit("extension:installed", manifest)
		this.logger.log(`Extension installed`, manifest)
	}

	uninstall = async (id) => {
		let extension = this.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension ${id} not found`)
		}

		this.runtime.eventBus.emit("extension:uninstalling", extension.manifest)
		this.logger.log(`Uninstalling extension`, extension.manifest)

		await this.unload(extension.manifest.id)
		await this.db.manifest.delete(extension.manifest.id)

		this.runtime.eventBus.emit("extension:uninstalled", extension.manifest)
		this.logger.log(`Extension uninstalled`, extension.manifest)
	}

	registerContext(id, value) {
		return (this.context[id] = value)
	}

	unregisterContext(id) {
		delete this.context[id]
	}

	async initialize() {
		await this.db.initialize()

		// load all extensions
		// TODO: load this to late app initializer to avoid waiting for extensions to load the app
		let extensions = await this.db.manifest.getAll()

		for (let extension of extensions) {
			await this.load(extension.id)
		}
	}
}
