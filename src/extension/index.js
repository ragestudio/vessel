import InternalConsole from "../classes/InternalConsole"
import EventBus from "../classes/EventBus"

export default class Extension {
    constructor(params = {}) {
        this.params = params
    }

    eventBus = new EventBus({
        id: this.constructor.namespace ?? this.constructor.name,
    })

    console = new InternalConsole({
        namespace: this.constructor.namespace ?? this.constructor.name,
    })

    async _init() {
        if (typeof this.onInitialize === "function") {
            this.onInitialize()
        }
    }
}