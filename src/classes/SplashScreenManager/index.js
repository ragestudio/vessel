export default class SplashScreenManager {
	constructor(containerId = "splash-screen") {
		this.containerId = containerId
	}

	attach() {
		const container = document.getElementById(this.containerId)
		if (container && !container.classList.contains("app_splash_visible")) {
			container.classList.add("app_splash_visible")
		}
	}

	detach() {
		const container = document.getElementById(this.containerId)
		if (container && container.classList.contains("app_splash_visible")) {
			container.classList.remove("app_splash_visible")
		}
	}
}
