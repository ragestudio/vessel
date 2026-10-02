import { Adapter } from "../../adapter"
import type { Runtime } from "../../runtime"

declare const require: any

export class ReactAdapter extends Adapter {
	constructor(runtime: Runtime) {
		super(runtime)
	}

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

		return coresContext
			.keys()
			.map((key: string) => coresContext(key).default)
	}
}
