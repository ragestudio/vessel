import InternalConsole from "./classes/InternalConsole"
import EventBus from "./classes/EventBus"
import { Runtime } from "./runtime"

export class Core {
	static namespace: string
	static disabled: boolean
	static dependencies: string[]

	static bgColor: string | undefined
	static textColor: string | undefined
	static awaitEvents: Record<string, any> | undefined

	constructor(runtime: Runtime, params?: any) {
		this.runtime = runtime
		this.params = params

		const constr = this.constructor as typeof Core

		this.console = new InternalConsole({
			namespace: constr.namespace ?? constr.name,
			bgColor: constr.bgColor,
			textColor: constr.textColor,
		})

		this.eventBus = new EventBus(constr.namespace ?? constr.name)

		this._initTooks = null
	}

	runtime: Runtime
	params: any

	console: InternalConsole
	eventBus: EventBus
	_initTooks: number | null

	public!: Record<string | symbol, any>
	onEvents!: Record<string, any> | undefined
	onRuntimeEvents!: Record<string, any> | undefined

	async onInitialize() {}
	async afterInitialize() {}

	async _init() {
		const constr = this.constructor as typeof Core

		const startTime = performance.now()
		const namespace = constr.namespace ?? constr.name

		let init_result: Record<string, any> = {
			namespace,
		}

		if (typeof this.onInitialize === "function") {
			await this.onInitialize()
		}

		if (typeof this.onEvents === "object") {
			Object.entries(this.onEvents).forEach(([event, handler]) => {
				this.eventBus.on(event, handler)
			})
		}

		if (typeof this.onRuntimeEvents === "object") {
			Object.entries(this.onRuntimeEvents).forEach(([event, handler]) => {
				this.runtime.eventBus.on(event, handler)
			})
		}

		if (typeof this.afterInitialize === "function") {
			this.runtime.initializer.add(this.afterInitialize.bind(this))
		}

		if (typeof constr.awaitEvents === "object") {
			let awaitEvents = []

			if (typeof constr.awaitEvents === "string") {
				awaitEvents = [constr.awaitEvents]
			} else if (Array.isArray(constr.awaitEvents)) {
				awaitEvents = constr.awaitEvents
			}

			// await to events before initialize
			await Promise.all(
				awaitEvents.map(([event, handler]) => {
					return new Promise((resolve) => {
						this.runtime.eventBus.once(event, (data: any) => {
							handler(data)
							resolve(data)
						})
					})
				}),
			)
		}

		this._initTooks = performance.now() - startTime

		return init_result
	}

	getPublicInterface() {
		return this.proxiedInterface(this.public)
	}

	proxiedInterface = (target: any) => {
		return new Proxy(target, {
			get: (target, prop) => {
				if (typeof target !== "object" || target === null) {
					return target
				}

				if (typeof target[prop] === "function") {
					return target[prop].bind(this)
				}

				return target[prop]
			},
			set: (target, prop, value) => {
				throw new Error(
					`Cannot set properties of a public interface of a core`,
				)
			},
		})
	}
}

export default Core
