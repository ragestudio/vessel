import type EventBus from "../classes/EventBus"

export default class Core {
	constructor(ctx: any, params: null | object) {}

	ctx: any
	params: null | object

	console: Console
	eventBus: EventBus
	_initTooks = null | number

	_init: () => void
	bindableReadOnlyProxy: (obj: object) => Proxy
}
