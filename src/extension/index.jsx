import InternalConsole from "../classes/InternalConsole"
import EventBus from "../classes/EventBus"
import loadable from "@loadable/component"

import replaceRelativeImportWithUrl from "../utils/replaceRelativeImportWithUrl"

function buildAppRender(renderURL, props) {
	return loadable(async () => {
		/* @vite-ignore */
		let RenderModule = await import(/* @vite-ignore */ renderURL)

		RenderModule = RenderModule.default

		return () => <RenderModule {...props} />
	})
}

export default class Extension {
	constructor(runtime, manager, manifest) {
		this.runtime = runtime
		this.manager = manager
		this.manifest = manifest

		this.originUrl = this.manifest.url.split("/").slice(0, -1).join("/")

		this.eventBus = new EventBus({
			id: this.constructor.namespace ?? this.constructor.name,
		})
		this.console = new InternalConsole({
			namespace: this.constructor.namespace ?? this.constructor.name,
		})
	}

	async _unload() {
		if (typeof this.onUnload === "function") {
			await this.onUnload()
		}

		if (typeof this.public === "object") {
			this.manager.unregisterContext(this.manifest.id)
		}

		if (typeof this.app === "object") {
			if (typeof this.app.render === "string") {
				this.app.renderComponent = null
			}
		}
	}

	async _init() {
		if (typeof this.onInitialize === "function") {
			this.onInitialize()
		}

		if (typeof this.public === "object") {
			this.manager.registerContext(this.manifest.id, this.public)
		}

		if (typeof this.app === "object") {
			if (typeof this.app.render === "string") {
				this.app.render = await replaceRelativeImportWithUrl(
					this.app.render,
					this.manifest.url,
				)

				this.app.renderComponent = await buildAppRender(
					this.app.render,
					{
						extension: {
							main: this,
							manifest: this.manifest,
						},
					},
				)
			}
		}
	}
}
