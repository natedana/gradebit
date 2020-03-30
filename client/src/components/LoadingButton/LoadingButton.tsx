import React from 'react'
import classNames from 'classnames'

import Button, { ButtonProps } from '@material-ui/core/Button'
import { CircularProgress } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'

interface LoadingButtonProps extends ButtonProps {
    loading: boolean
}

const useStyles = makeStyles((theme: Theme) => ({
    wrapper: {
        margin: theme.spacing(1),
        position: 'relative'
    },
    buttonProgress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12
    }
}))

const LoadingButton = ({ loading, className, ...props }: LoadingButtonProps) => {
    const classes = useStyles()

    return (
        <div className={ classNames(classes.wrapper, className) }>
            <Button { ...props } disabled={ props.disabled || loading }/>
            { loading && <CircularProgress size={ 24 } className={ classes.buttonProgress }/> }
        </div>
    )
}

export default LoadingButton
