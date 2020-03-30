import React from 'react'

import { Snackbar, SnackbarContent } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

interface ErrorSnackbarProps {
    open: boolean
    message: string
    clearError: () => void
}

const useStyles = makeStyles(theme => ({
    snackbar: {
        backgroundColor: theme.palette.error.main
    }
}))

const ErrorSnackbar = ({ open, message, clearError }: ErrorSnackbarProps) => {
    const classes = useStyles()

    return (
        <Snackbar
            open={ open }
            autoHideDuration={ 3000 }
            onClose={ clearError }>
            <SnackbarContent
                className={ classes.snackbar }
                message={ message }/>
        </Snackbar>
    )
}

export default ErrorSnackbar
