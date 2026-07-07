import Core from "./core"
import { Runtime } from "./runtime"

// export interface AdapterS {
// 	scanCores(): Promise<(typeof Core)[]>
// 	splash: {
// 		attach: () => void
// 		detach: () => void
// 	}
// 	startInit?(): Promise<void>
// 	finishInit?(): Promise<void>
// 	public?: Record<string, any>
// }

export class Adapter {
	constructor(runtime?: Runtime) {
		this.runtime = runtime
	}

	runtime: Runtime

	_connect_runtime(runtime: Runtime) {
		this.runtime = runtime
	}

	public?: Record<string, any>

	splash: {
		attach: () => void
		detach: () => void
	} = {
		attach: () => {},
		detach: () => {},
	}

	startInit?(): Promise<void> {
		return Promise.resolve()
	}

	finishInit?(): Promise<void> {
		return Promise.resolve()
	}

	scanCores(): Promise<(typeof Core)[]> {
		return Promise.resolve([])
	}
}
