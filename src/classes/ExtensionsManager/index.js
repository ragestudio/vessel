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

		app.eventBus.emit("extension:loading", manifest)
		this.logger.log(`Loading extension`, manifest)

		if (!manifest.main) {
			throw new Error("Extension manifest is missing main file")
		}

		const startLoadAt = performance.now()

		let main = null

		if (manifest.enabled == true) {
			// load main file
			let mainClass = await import(
				/* @vite-ignore */
				manifest.main
			)

			// inject dependencies
			mainClass = mainClass.default

			// initializate
			main = new mainClass(this.runtime, this, manifest)

			await main._init()
		}

		const loadDuration = performance.now() - startLoadAt

		// set extension in map
		this.extensions.set(manifest.id, {
			id: manifest.id,
			manifest: manifest,
			main: main,
			worker: null,
			loadDuration: loadDuration,
			enabled: manifest.enabled,
		})

		app.eventBus.emit("extension:loaded", manifest)
		this.logger.log(`Extension loaded`, manifest)
	}

	unload = async (id) => {
		let extension = this.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension ${id} not found`)
		}

		await extension.main._unload()

		//this.extensions.delete(id)

		app.eventBus.emit("extension:unloaded", extension.manifest)
		this.logger.log(`Extension unloaded`, extension.manifest)
	}

	install = async (manifestUrl) => {
		let manifest = null

		if (isUrl(manifestUrl)) {
			manifest = await fetch(manifestUrl)
			manifest = await manifest.json()
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
		await this.load(manifest.id)

		app.eventBus.emit("extension:installed", manifest)
		this.logger.log(`Extension installed`, manifest)
	}

	uninstall = async (id) => {
		let extension = this.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension ${id} not found`)
		}

		app.eventBus.emit("extension:uninstalling", extension.manifest)
		this.logger.log(`Uninstalling extension`, extension.manifest)

		await this.unload(extension.manifest.id)
		await this.db.manifest.delete(extension.manifest.id)
		this.extensions.delete(id)

		app.eventBus.emit("extension:uninstalled", extension.manifest)
		this.logger.log(`Extension uninstalled`, extension.manifest)
	}

	registerContext(id, value) {
		return (this.context[id] = value)
	}

	unregisterContext(id) {
		delete this.context[id]
	}

	toggleExtension = async (id, to) => {
		let extension = this.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension ${id} not found`)
		}

		if (typeof to !== "boolean") {
			to = !extension.enabled
		}

		extension.manifest.enabled = to
		extension.enabled = to

		await this.db.manifest.put(extension.manifest)
		this.extensions.set(id, extension)

		if (extension.manifest.enabled) {
			await this.load(extension.manifest.id)
		} else {
			await this.unload(extension.manifest.id)
		}
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
