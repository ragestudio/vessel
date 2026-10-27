import React from "react"
import { Outlet } from "react-router"

export interface RouterRootContextType {
	children?: React.ReactNode
}

export const RouterRootContext = React.createContext<RouterRootContextType>({
	children: null,
})

export const RootRoute: React.FC = () => {
	const { children } = React.useContext(RouterRootContext)
	return children ? React.createElement(React.Fragment, null, children) : React.createElement(Outlet)
}
