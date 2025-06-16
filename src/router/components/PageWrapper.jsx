import React from "react"
import propTypes from "prop-types"
import { useNavigation } from "react-router"

import { useLoaderData, useParams } from "react-router"

const PageWrapper = ({
	path,
	element,
	declaration,
	loadFallback,
	onMount,
	onUnmount = () => true,
	...props
}) => {
	const navigation = useNavigation()
	const loaderData = useLoaderData()
	const params = useParams()

	React.useEffect(() => {
		if (typeof onMount === "function") {
			onMount({
				element: element,
				declaration: declaration,
			})
		}

		return onUnmount
	}, [])

	if (navigation.state === "loading" && loadFallback) {
		return React.createElement(loadFallback)
	}

	return React.createElement(element, {
		...props,
		params: params,
		loaderData: loaderData,
	})
}

PageWrapper.propTypes = {
	path: propTypes.string.isRequired,
	element: propTypes.func.isRequired,
	declaration: propTypes.object.isRequired,
	loadFallback: propTypes.func,
	onMount: propTypes.func,
	onUnmount: propTypes.func,
}

export default PageWrapper
