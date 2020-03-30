import React, { useState } from 'react'

import { FormControl, IconButton, Input, InputAdornment, InputLabel, Paper, Popover, Tooltip } from '@material-ui/core'
import { Check } from '@material-ui/icons'
import { makeStyles } from '@material-ui/core/styles'

interface ConfirmPopperProps {
    title: string
    prompt: string
    icon: React.ReactNode
    preventConfirm?: boolean
    invisible?: boolean
    submit: (text: string) => void
}

const useStyles = makeStyles(theme => ({
    container: {
        padding: theme.spacing(2),
        minWidth: '400px'
    }
}))

const ConfirmPopper = (props: ConfirmPopperProps) => {
    const [text, setText] = useState('')
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

    const classes = useStyles()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (props.preventConfirm) {
            props.submit('')
        } else {
            setAnchorEl(event.currentTarget)
        }
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value as string)
    }

    if (props.invisible) {
        return null
    }

    const popper = (
        <Popover anchorEl={ anchorEl } open={ !!anchorEl } onClose={ handleClose }
            anchorOrigin={ {
                vertical: 'bottom',
                horizontal: 'left'
            } }
            transformOrigin={ {
                vertical: 'top',
                horizontal: 'center'
            } }>
            <Paper className={ classes.container }>
                <FormControl fullWidth>
                    <InputLabel shrink htmlFor="confirmpopper">{ props.prompt }</InputLabel>
                    <Input margin="dense" value={ text } onChange={ handleChange } id="confirmpopper"
                        endAdornment={
                            <InputAdornment position="end">
                                <Tooltip title="Submit">
                                    <IconButton onClick={ () => props.submit(text) } role="submit">
                                        <Check/>
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        }/>
                </FormControl>
            </Paper>
        </Popover>
    )

    return (
        <div>
            <Tooltip title={ props.title }>
                <IconButton color="inherit" onClick={ handleClick }>
                    { props.icon }
                </IconButton>
            </Tooltip>
            { popper }
        </div>
    )
}

export default ConfirmPopper
