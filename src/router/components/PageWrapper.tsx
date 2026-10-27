import React from "react"
import { useLoaderData, useNavigation, useParams } from "react-router"

export type PageWrapperProps = {
	path: string
	element: React.ComponentType<any>
	declaration: any
	loadFallback?: React.ComponentType | undefined
	onMount?: ((context: any) => void) | undefined
	onUnmount?: (() => void) | undefined
	[key: string]: any
}

const PageWrapper = ({
	path,
	element,
	declaration,
	loadFallback,
	onMount,
	onUnmount,
	...props
}: PageWrapperProps) => {
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
	}, [path, element, declaration])

	if (navigation.state === "loading" && loadFallback) {
		return React.createElement(loadFallback)
	}

	return React.createElement(element, {
		...props,
		params: params,
		loaderData: loaderData,
	})
}

export default PageWrapper
