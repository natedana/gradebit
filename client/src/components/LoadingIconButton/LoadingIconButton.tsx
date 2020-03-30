import React from 'react'

import { CircularProgress, IconButton, Tooltip } from '@material-ui/core'

interface LoadingIconButtonProps {
    loading: boolean
    submit: () => void
    title: string
    visible?: boolean
    icon?: React.ReactNode
}

const LoadingIconButton = ({ loading, submit, title, icon, visible }: LoadingIconButtonProps) => {

    if (visible !== undefined && !visible) {
        return null
    } else if (loading) {
        return <CircularProgress size={ 24 }/>
    } else {
        return (
            <Tooltip title={ title }>
                <IconButton onClick={ submit }>
                    { icon }
                </IconButton>
            </Tooltip>
        )
    }

}

export default LoadingIconButton
