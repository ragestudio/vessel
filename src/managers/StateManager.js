import { Observable } from "object-observer"

export default class StateManager {
	constructor(runtime) {
		this.runtime = runtime
		this.states = Observable.from({
			status: "booting",
			loadedCores: [],
			activePlugins: [],
			errors: [],
		})
	}

	transitionTo(newState, payload) {
		const validTransitions = {
			booting: ["initializing", "crashed"],
			initializing: ["ready", "crashed"],
			ready: ["suspend", "crashed"],
			crashed: [],
		}

		if (validTransitions[this.states.status].includes(newState)) {
			this.states.status = newState
			this.runtime.eventBus.emit(`runtime.state.${newState}`, payload)
		}
	}
}
