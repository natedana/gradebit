import React, { ReactNode } from 'react'

import { Grid, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

interface ValueProps {
    label: string
    value: ReactNode
}

const useStyles = makeStyles(theme => ({
    container: {
        paddingRight: theme.spacing(2),
        width: '16em',
        wordBreak: 'break-all'
    }
}))

const Value = ({ label, value }: ValueProps) => {
    const classes = useStyles()

    return (
        <Grid item className={ classes.container }>
            <Typography style={ { textTransform: 'capitalize' } } variant="subtitle1" color="textSecondary">{ label }</Typography>
            <Typography gutterBottom>{ value }</Typography>
        </Grid>
    )
}

export default Value
