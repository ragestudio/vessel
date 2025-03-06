import { Observable } from "object-observer"

export default (observableArray, eventBus, eventName) => {
	Observable.observe(observableArray, (changes) => {
		changes.forEach((change) => {
			if (change.type === "insert") {
				eventBus.emit(eventName, change)
			}
		})
	})
}
