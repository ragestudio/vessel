export interface InternalConsoleParams {
	namespace?: unknown
	bgColor?: string
	textColor?: string
}

type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug" | "trace"

class InternalConsole {
	public readonly namespace: string
	public readonly bgColor: string
	public readonly color: string
	public readonly tagStyle: string
	private timers: Map<string, number>

	public log!: (...args: any[]) => void
	public info!: (...args: any[]) => void
	public warn!: (...args: any[]) => void
	public error!: (...args: any[]) => void
	public debug!: (...args: any[]) => void
	public trace!: (...args: any[]) => void

	constructor(params: InternalConsoleParams = {}) {
		this.namespace = String(params.namespace)
		this.bgColor = params.bgColor ?? "dimgray"
		this.color = params.textColor ?? "azure"
		this.tagStyle = `background-color: ${this.bgColor}; color: ${this.color}; font-weight: bold; padding: 3px 7px; border-radius: 8px;`

		this.timers = new Map<string, number>()

		const methods: ConsoleMethod[] = [
			"log",
			"info",
			"warn",
			"error",
			"debug",
			"trace",
		]

		methods.forEach((method) => {
			const originalMethod = console[method].bind(console)

			this[method] = (...args: any[]) => {
				const formatParts: string[] = [`%c[${this.namespace}]%c`]
				const styles: any[] = [this.tagStyle, ""]

				args.forEach((arg) => {
					if (typeof arg === "object" || typeof arg === "function") {
						formatParts.push("%o")
					} else {
						formatParts.push("%s")
					}
					styles.push(arg)
				})

				originalMethod(formatParts.join(" "), ...styles)
			}

			Object.setPrototypeOf(
				this[method],
				Object.getPrototypeOf(console[method]),
			)
		})
	}

	public time(label: string = "default"): void {
		this.timers.set(label, performance.now())
	}

	public timeEnd(label: string = "default"): void {
		const startTime = this.timers.get(label)

		if (startTime !== undefined) {
			const duration = performance.now() - startTime
			this.timers.delete(label)

			this.debug(`${label}: ${duration}ms`)
		}
	}
}

export default InternalConsole
