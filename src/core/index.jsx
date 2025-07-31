import InternalConsole from "../classes/InternalConsole"
import EventBus from "../classes/EventBus"

export default class Core {
	constructor(ctx, params) {
		this.ctx = ctx
		this.params = params

		this.console = new InternalConsole({
			namespace: this.constructor.namespace ?? this.constructor.name,
			bgColor: this.constructor.bgColor,
			textColor: this.constructor.textColor,
		})

		this.eventBus = new EventBus({
			id: this.constructor.namespace ?? this.constructor.name,
		})

		this._initTooks = null
	}

	async _init() {
		const startTime = performance.now()
		const namespace = this.constructor.namespace ?? this.constructor.name

		let init_result = {
			namespace,
		}

		if (typeof this.onInitialize === "function") {
			await this.onInitialize()
		}

		if (this.public) {
			init_result.public_context = this.bindableReadOnlyProxy(this.public)
		}

		if (typeof this.onEvents === "object") {
			Object.entries(this.onEvents).forEach(([event, handler]) => {
				this.eventBus.on(event, handler)
			})
		}

		if (typeof this.onRuntimeEvents === "object") {
			Object.entries(this.onRuntimeEvents).forEach(([event, handler]) => {
				this.ctx.eventBus.on(event, handler)
			})
		}

		if (typeof this.afterInitialize === "function") {
			this.ctx.appendToInitializer(this.afterInitialize.bind(this))
		}

		if (typeof this.constructor.awaitEvents === "object") {
			let awaitEvents = []

			if (typeof this.constructor.awaitEvents === "string") {
				awaitEvents = [this.constructor.awaitEvents]
			} else if (Array.isArray(this.constructor.awaitEvents)) {
				awaitEvents = this.constructor.awaitEvents
			}

			// await to events before initialize
			await Promise.all(
				awaitEvents.map(([event, handler]) => {
					return new Promise((resolve) => {
						this.ctx.eventBus.once(event, (data) => {
							handler(data)
							resolve()
						})
					})
				}),
			)
		}

		this._initTooks = performance.now() - startTime

		return init_result
	}

	/**
	 * Bindable read only proxy for public methods of core.
	 *
	 * Bindable means that when a method is accessed, it will be bound to the
	 * core instance. This is useful when you want to pass a public method to
	 * an event or something, so when it is called, it will be called with
	 * the correct context.
	 *
	 * Read only means that the properties of the core cannot be modified
	 * through this proxy.
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	bindableReadOnlyProxy(obj) {
		return new Proxy(obj, {
			get: (target, prop) => {
				if (typeof target[prop] === "function") {
					return target[prop].bind(this)
				}

				return target[prop]
			},
			set: (target, prop, value) => {
				throw new Error("Cannot set property of public core method")
			},
		})
	}
}
