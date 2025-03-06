export default class ContextManager {
	constructor(runtime) {
		this.runtime = runtime
		this.context = {}
		this.proxy = this.createSecureProxy()
	}

	createSecureProxy() {
		return new Proxy(this.context, {
			get: (target, prop) => target[prop],
			set: () => {
				throw new Error("Direct context modification not allowed")
			},
			defineProperty: () => false,
		})
	}

	registerConstant(key, value) {
		Object.defineProperty(this.context, key, {
			value,
			writable: false,
			configurable: false,
		})
	}

	registerService(key, factory) {
		Object.defineProperty(this.context, key, {
			get: factory,
			configurable: false,
			enumerable: true,
		})
	}
}
