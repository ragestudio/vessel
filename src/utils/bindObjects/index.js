export default function bindObjects(bind, events) {
	let boundEvents = {}

	for (const [event, handler] of Object.entries(events)) {
		if (typeof handler === "object") {
			boundEvents[event] = bindObjects(bind, handler)
		} else if (typeof handler === "function") {
			boundEvents[event] = handler.bind(bind)
		}
	}

	return boundEvents
}
