export default () => {
	return !!(window.__TAURI__ ?? window.__ELECTRON__)
}
