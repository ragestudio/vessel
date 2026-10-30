export type ExtensionManifest = {
	id: string
	main: string
	runtimed?: boolean

	url?: string
	remoteMain?: string

	// Runtimed expecific values
	enabled?: boolean
}

export type ExtensionInstance = {
	id: string
	manifest: ExtensionManifest
	main: any
	worker: any
	loadDuration: number
	enabled?: boolean | undefined
	runtimed?: boolean | undefined
}
