import InternalConsole from "../InternalConsole"
import { isUrl } from "../../utils/url"
import * as Comlink from "comlink"

import ExtensionWorker from "../../workers/extension.js?worker"

export default class ExtensionManager {
	logger = new InternalConsole({
		namespace: "ExtensionsManager",
		bgColor: "bgMagenta",
	})

	extensions = new Map()

	loadExtension = async (manifest) => {
		throw new Error("Not implemented")

		if (isUrl(manifest)) {
			manifest = await fetch(manifest)
			manifest = await manifest.json()
		}

		const worker = new ExtensionWorker()

		worker.postMessage({
			event: "load",
			manifest: manifest,
		})

		await new Promise((resolve) => {
			worker.onmessage = ({ data }) => {
				if (data.event === "loaded") {
					resolve()
				}
			}
		})

		console.log(Comlink.wrap(worker))

		// if (typeof main.events === "object") {
		//     Object.entries(main.events).forEach(([event, handler]) => {
		//         main.event.on(event, handler)
		//     })
		// }

		// this.extensions.set(manifest.registryId,main.public)
	}

	installExtension = async () => {}
}
