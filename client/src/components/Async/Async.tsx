import React, { ComponentType } from 'react'

import { Typography } from '@material-ui/core'

import LoadingIndicator from 'Components/LoadingIndicator'

import { AsyncBase, AsyncData } from 'Types'

interface BaseProps {
    errorMessage?: string
    LoadingComponent?: ComponentType
    ErrorComponent?: ComponentType<{ error: Error }>
}

interface AsyncProps extends BaseProps {
    state: AsyncBase
    children?: () => JSX.Element
}

interface AsyncDataProps<T> extends BaseProps {
    state: AsyncData<T>
    children?: (data: T) => JSX.Element
}

type CombinedProps<T> = AsyncProps | AsyncDataProps<T>

const Async = <T extends unknown>({ state, children, ErrorComponent, errorMessage, LoadingComponent }: CombinedProps<T>) => {
    if (state.error) {
        if (ErrorComponent) {
            return <ErrorComponent error={ state.error }/>
        } else {
            return <Typography align="center" color="error">{ errorMessage || state.error.message }</Typography>
        }
    } else if (state.loading) {
        if (LoadingComponent) {
            return <LoadingComponent/>
        } else {
            return <LoadingIndicator/>
        }
    } else if (children) {
        const data = 'data' in state ? state.data : undefined
        return children(data!)
    } else {
        return null
    }
}

export default Async
