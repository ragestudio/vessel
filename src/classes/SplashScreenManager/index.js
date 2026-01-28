export default class SplashScreenManager {
	constructor(containerId = "splash-screen") {
		this.containerId = containerId
	}

	attach() {
		const container = document.getElementById(this.containerId)

		container.style.setProperty("--visible", 1)
	}

	detach() {
		const container = document.getElementById(this.containerId)

		container.style.setProperty("--visible", 0)
	}
}
