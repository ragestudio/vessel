import type { Runtime } from "../runtime"
import type { ExtensionInstance } from "./types"

import InternalConsole from "../classes/InternalConsole"
import ExtensionsDB from "./db"

import load from "./methods/load"
import loadById from "./methods/loadById"
import unload from "./methods/unload"
import install from "./methods/install"
import uninstall from "./methods/uninstall"
import toggleExtension from "./methods/toggleExtension"
import initialize from "./methods/initialize"

export class ExtensionsManager extends Map<string, ExtensionInstance> {
	constructor(runtime: Runtime) {
		super()
		this.runtime = runtime
	}

	runtime: Runtime

	db = new ExtensionsDB()
	context: Record<string, any> = {}
	logger = new InternalConsole({
		namespace: "ExtensionsManager",
		bgColor: "bgMagenta",
	})

	initialize = initialize.bind(this) as OmitThisParameter<typeof initialize>
	load = load.bind(this) as OmitThisParameter<typeof load>
	loadById = loadById.bind(this) as OmitThisParameter<typeof loadById>
	unload = unload.bind(this) as OmitThisParameter<typeof unload>

	install = install.bind(this) as OmitThisParameter<typeof install>
	uninstall = uninstall.bind(this) as OmitThisParameter<typeof uninstall>

	toggleExtension = toggleExtension.bind(this) as OmitThisParameter<
		typeof toggleExtension
	>

	isInstalled = async (id: string) => {
		const manifest = await this.db.manifest.get(id)

		return !!manifest
	}

	registerContext(id: string, value: any) {
		return (this.context[id] = value)
	}

	unregisterContext(id: string) {
		delete this.context[id]
	}
}

export default ExtensionsManager
