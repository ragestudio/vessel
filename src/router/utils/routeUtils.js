/**
 * Get page paths with mobile support
 */
export const getPagePaths = () => {
	let paths = {
		...import.meta.glob("/src/pages/**/[a-z[]*.jsx"),
		...import.meta.glob("/src/pages/**/[a-z[]*.tsx"),
	}

	if (app.isMobile) {
		const mobilePaths = {
			...import.meta.glob("/src/pages/**/[a-z[]*.mobile.jsx"),
			...import.meta.glob("/src/pages/**/[a-z[]*.mobile.tsx"),
		}

		paths = { ...paths, ...mobilePaths }

		// Replace non-mobile routes with mobile routes when available
		Object.keys(paths).forEach((path) => {
			const mobilePath = path
				.replace(/\.jsx$/, ".mobile.jsx")
				.replace(/\.tsx$/, ".mobile.tsx")

			if (mobilePaths[mobilePath]) {
				delete paths[path]
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
