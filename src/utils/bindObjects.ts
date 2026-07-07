export default function bindObjects(bind: any, events: Record<string, any>) {
	let boundEvents: Record<string, any> = {}

	for (const [event, handler] of Object.entries(events)) {
		if (typeof handler === "object") {
			boundEvents[event] = bindObjects(bind, handler)
		} else if (typeof handler === "function") {
			boundEvents[event] = handler.bind(bind)
		}
	}

	return boundEvents
}
