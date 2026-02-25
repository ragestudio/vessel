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

	loadById = async (id) => {
		let manifest = await this.db.manifest.get(id)

		if (!manifest) {
			throw new Error(`Extension ${id} not found`)
		}

		return this.load(manifest)
	}

	load = async (manifest) => {
		app.eventBus.emit("extension:loading", manifest)
		this.logger.log(`Loading extension`, manifest)

		if (!manifest.main) {
			throw new Error("Extension manifest is missing main file")
		}

		// check if is already loaded
		if (this.extensions.has(manifest.id)) {
			this.logger.warn(
				`Extension [${manifest.id}] is already loaded, unloading...`,
			)
			await this.unload(manifest.id)
		}

		let main = null
		const startLoadAt = performance.now()
		const importUrl =
			(manifest.remoteMain ?? manifest.main) + "?t=" + Date.now()

		if (manifest.enabled === true) {
			let mainClass = await import(
				/* @vite-ignore */
				importUrl
			)

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
			runtimed: manifest.runtimed,
		})

		app.eventBus.emit("extension:loaded", manifest)
		this.logger.log(`Extension loaded`, manifest)
	}

	unload = async (id) => {
		let extension = this.extensions.get(id)

		if (!extension) {
			throw new Error(`Extension ${id} not found`)
		}

		try {
			await extension.main._unload()

			app.eventBus.emit("extension:unloaded", extension.manifest)
			this.logger.log(`Extension unloaded`, extension.manifest)
		} catch {
			this.logger.error(`Error unloading extension`, extension.manifest)
			return null
		}
	}

	install = async (manifestUrl) => {
		if (app.isDesktop) {
			return await window.ipcRenderer.invoke(
				"extensions:install",
				manifestUrl,
			)
		}

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
		await this.loadById(manifest.id)

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
		if (app.isDesktop) {
			if (window.ipcRenderer.on) {
				window.ipcRenderer.on("extensions:load", (event, manifest) => {
					this.logger.log(
						"Load extension received from IPC:",
						manifest,
					)
					this.load(manifest)
				})
			}

			let manifests = await fetch(
				"http://localhost:11150/extensions/list",
			)

			if (manifests.ok) {
				manifests = await manifests.json()

				for (let manfiest of manifests) {
					this.load(manfiest)
				}
			}
		}

		await this.db.initialize()

		// load all extensions
		// TODO: load this to late app initializer to avoid waiting for extensions to load the app
		let extensions = await this.db.manifest.getAll()

		for (let extension of extensions) {
			try {
				await this.load(extension)
			} catch (error) {
				this.logger.error(
					`Error loading extension ${extension.id}:`,
					error,
				)
			}
		}
	}

	isInstalled = async (id) => {
		const manifest = await this.db.manifest.get(id)

		return !!manifest
	}
}
