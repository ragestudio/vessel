import EventEmitter from "./EventEmitter"

export default class EventBus extends EventEmitter {
	constructor(params = {}) {
		super({ ...params, captureRejections: true })

		this.id = params?.id
	}

	_emit = this.emit

	emit = (event, ...args) => {
		return this._emit(event, ...args)
	}

	on = (event, listener, context) => {
		return this._addListener(event, listener, context, true, false)
	}

	off = (event, listener) => {
		return this.removeListener(event, listener)
	}

	once = (event, listener, context) => {
		return this.once(event, listener, context)
	}
}
