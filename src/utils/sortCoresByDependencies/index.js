export default (cores) => {
	cores.forEach((core) => {
		if (core.dependencies) {
			core.dependencies.forEach((dependency) => {
				const depIndex = cores.findIndex((_core) => {
					return (_core.namespace ?? _core.name) === dependency
				})
				if (depIndex === -1) {
					console.error(
						`Cannot find dependency [${dependency}] for core [${core.name}]`,
					)
					return
				}
				if (depIndex !== 0) {
					cores.unshift(cores.splice(depIndex, 1)[0])
				}
			})
		}
	})

	return cores
}
