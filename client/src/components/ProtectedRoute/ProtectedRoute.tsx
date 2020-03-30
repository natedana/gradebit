import React from 'react'
import { Redirect, Route, RouteProps } from 'react-router-dom'

interface ProtectionProps {
    enabled: boolean | undefined
    loading?: boolean | undefined
}

type ProtectedRouteProps = RouteProps & ProtectionProps

const ProtectedRoute = (props: ProtectedRouteProps) => {
    if (props.enabled) {
        return (
            <Route { ...props }/>
        )
    } else if (props.loading) {
        return null
    } else {
        const { component, render, children, ...newProps } = props
        return (
            <Route { ...newProps } render={ () => (
                <Redirect to="/"/>
            ) }/>
        )
    }
}

export default ProtectedRoute
