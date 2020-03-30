import React from 'react'
import { CircularProgress, Grid } from '@material-ui/core'

interface LoadingIndicatorProps {
    text?: string
}

const LoadingIndicator = ({ text }: LoadingIndicatorProps) => {
    return (
        <Grid container justify="center" alignItems="center">
            { text && <span>{ text }</span> }
            <CircularProgress/>
        </Grid>
    )
}

export default LoadingIndicator
