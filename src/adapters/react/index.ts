import { Adapter } from "../../adapter"
import type { Runtime } from "../../runtime"

import React from "react"
globalThis.React = React

import ReactDomClient from "react-dom/client"
import Location from "./location"

export class ReactAdapter extends Adapter {
	root: ReactDomClient.Root = ReactDomClient.createRoot(
		document.getElementById("root"),
	)

	splashContainerId: string = "splash-screen"

	splash = {
		attach: () => {
			const container = document.getElementById(this.splashContainerId)

			container.style.setProperty("--visible", "1")
		},
		detach: () => {
			const container = document.getElementById(this.splashContainerId)

			container.style.setProperty("--visible", "0")
		},
	}

	async startInit() {
		this.runtime.registerPublicField("location", Location)
	}

	async finishInit() {
		const renderer = React.createElement(this.runtime.baseAppClass as any, {
			runtime: this.runtime,
		})

		// @ts-ignore
		this.root.render(renderer)
	}

	async scanCores() {
		const paths = import.meta.glob(
			[
				"/src/cores/*/*.core.jsx",
				"/src/cores/*/*.core.js",
				"/src/cores/*/*.core.ts",
				"/src/cores/*/*.core.tsx",
			],
			{ eager: true },
		)

		return Object.values(paths).map((mod: any) => {
			return mod.default
		})
	}
}

export default ReactAdapter
