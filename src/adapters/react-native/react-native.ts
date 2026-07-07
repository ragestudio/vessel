import type { Adapter } from "../../adapter"
import type { Runtime } from "../../runtime"

import React from "react"
globalThis.React = React

export class ReactAdapter implements Adapter {
	constructor(runtime: Runtime) {
		this.runtime = runtime
	}

	runtime: Runtime

	splash = {
		attach: () => {},
		detach: () => {},
	}

	async scanCores() {
		const coresContext = require.context(
			"../cores",
			true,
			/\.core\.(js|jsx|ts|tsx)$/,
		)

		return coresContext.keys().map((key) => coresContext(key).default)
	}
}
