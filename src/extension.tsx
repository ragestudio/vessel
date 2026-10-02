import type { ExtensionManifest, Runtime } from "./runtime"

import InternalConsole from "./classes/InternalConsole"
import EventBus from "./classes/EventBus"
import loadable, { LoadableComponent } from "@loadable/component"

import { replaceRelativeImportWithUrl } from "./utils/url"
import { ReactNode } from "react"

function buildAppRender(renderURL: string, props: any) {
	return loadable(async () => {
		// @vite-ignore
		// @ts-ignore
		let RenderModule = await import(renderURL)

		RenderModule = RenderModule.default

		return () => <RenderModule {...props} />
	})
}

export default class Extension {
	static namespace: string
	originUrl: string

	runtime: Runtime
	manifest: ExtensionManifest

	eventBus: EventBus
	console: InternalConsole

	declare onInitialize: () => Promise<void>
	declare onUnload: () => Promise<void>

	declare public: Record<string, any>
	declare app: {
		render: string
		renderComponent: ReactNode | LoadableComponent<any>
	}

	constructor(runtime: Runtime, manifest: ExtensionManifest) {
		this.runtime = runtime
		this.manifest = manifest

		this.originUrl = this.manifest.url.split("/").slice(0, -1).join("/")

		const ctor = this.constructor as typeof Extension

		this.eventBus = new EventBus(ctor.namespace ?? ctor.name)
		this.console = new InternalConsole({
			namespace: ctor.namespace ?? ctor.name,
		})
	}

	async _unload() {
		if (typeof this.onUnload === "function") {
			await this.onUnload()
		}

		if (typeof this.public === "object") {
			this.runtime.extensions.unregisterContext(this.manifest.id)
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
			this.runtime.extensions.registerContext(this.manifest.id, this.public)
		}

		if (typeof this.app === "object") {
			if (typeof this.app.render === "string") {
				this.app.render = replaceRelativeImportWithUrl(
					this.app.render,
					this.manifest.url,
				)

				this.app.renderComponent = buildAppRender(this.app.render, {
					extension: {
						main: this,
						manifest: this.manifest,
					},
				})
			}
		}
	}
}
