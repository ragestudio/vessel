class InternalConsole {
	constructor(params = {}) {
		this.namespace = String(params.namespace)
		this.bgColor = params.bgColor ?? "dimgray"
		this.color = params.textColor ?? "azure"
		this.tagStyle = `background-color: ${this.bgColor}; color: ${this.color}; font-weight: bold; padding: 3px 7px; border-radius: 8px;`
		this.timers = new Map()

		const methods = ["log", "info", "warn", "error", "debug", "trace"]

		methods.forEach((method) => {
			const originalMethod = console[method].bind(console)

			this[method] = (...args) => {
				const formatParts = [`%c[${this.namespace}]%c`]
				const styles = [this.tagStyle, ""]

				args.forEach((arg) => {
					if (typeof arg === "object" || typeof arg === "function") {
						formatParts.push("%o")
					} else {
						formatParts.push("%s")
					}
					styles.push(arg)
				})

				return originalMethod(formatParts.join(" "), ...styles)
			}

			Object.setPrototypeOf(
				this[method],
				Object.getPrototypeOf(console[method]),
			)
		})
	}

	time(label = "default") {
		this.timers.set(label, performance.now())
	}

	timeEnd(label = "default") {
		const startTime = this.timers.get(label)

		if (startTime) {
			const duration = performance.now() - startTime
			this.timers.delete(label)

			this.debug(`${label}: ${duration}ms`)
		}
	}
}

export default InternalConsole
