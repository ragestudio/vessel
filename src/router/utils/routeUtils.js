/**
 * Get page paths with mobile support
 */
export const getPagePaths = () => {
	const allPaths = {
		...import.meta.glob("/src/pages/**/[a-z[]*.jsx"),
		...import.meta.glob("/src/pages/**/[a-z[]*.tsx"),
	}

	let paths = {}

	if (app.isMobile) {
		const mobilePaths = {}
		const desktopPaths = {}

		Object.keys(allPaths).forEach((path) => {
			if (path.includes(".mobile.")) {
				mobilePaths[path] = allPaths[path]
			} else {
				desktopPaths[path] = allPaths[path]
			}
		})

		paths = { ...desktopPaths, ...mobilePaths }

		// Replace non-mobile routes with mobile routes when available
		Object.keys(desktopPaths).forEach((path) => {
			const mobilePath = path
				.replace(/\.jsx$/, ".mobile.jsx")
				.replace(/\.tsx$/, ".mobile.tsx")

			if (mobilePaths[mobilePath]) {
				delete paths[path]
			}
		})
	} else {
		Object.keys(allPaths).forEach((path) => {
			if (!path.includes(".mobile.")) {
				paths[path] = allPaths[path]
			}
		})
	}

	return paths
}

/**
 * Transform file path to route path
 */
export const transformPathToRoute = (filePath) => {
	let path = filePath
		.replace(/\/src\/pages|index|\.jsx$/g, "")
		.replace(/\/src\/pages|index|\.tsx$/g, "")
		.replace(/\/src\/pages|index|\.mobile|\.jsx$/g, "")
		.replace(/\/src\/pages|index|\.mobile|\.tsx$/g, "")

	// Convert dynamic segments
	path = path.replace(/\[([a-z]+)\]/g, ":$1")
	path = path.replace(/\[\.{3}.+\]/, "*").replace(/\[(.+)\]/, ":$1")

	return path || "/"
}

/**
 * Generate routes from file system
 */
export const generateRoutes = () => {
	const paths = getPagePaths()

	const routes = Object.keys(paths).map((route) => ({
		path: transformPathToRoute(route),
		import: paths[route],
		originalPath: route,
	}))

	return routes
}

/**
 * Create route pattern for matching
 */
export const createRoutePattern = (routePath) => {
	return routePath.replace(/\*/g, ".*").replace(/!/g, "^")
}

/**
 * Test if route matches pattern
 */
export const testRouteMatch = (pattern, route) => {
	const routePattern = createRoutePattern(pattern)

	return new RegExp(routePattern).test(route)
}

/**
 * Find route declaration
 */

export const findRouteDeclaration = (path, declarations = []) => {
	const foundDeclaration = declarations.find((layout) => {
		return testRouteMatch(layout.path, path)
	})

	return (
		foundDeclaration || {
			useLayout: "default",
			public: false,
			path: path,
		}
	)
}
