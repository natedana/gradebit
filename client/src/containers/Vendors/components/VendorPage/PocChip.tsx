import React, { useState } from 'react'

import { Avatar, Chip, Paper, Popover, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { FileCopy, Info } from '@material-ui/icons'

import Value from 'Components/Value'

import { Stakeholder } from 'Types'

interface VendorPageProps {
    poc: Stakeholder
    onCopy: (label: string, value: string) => void
}

const useStyles = makeStyles(theme => ({
    popper: {
        margin: theme.spacing(1),
        boxShadow: 'none'
    },
    value: {
        display: 'flex',
        alignContent: 'center',
        justifyContent: 'space-between'
    }
}))

const VendorPage = ({ poc, onCopy }: VendorPageProps) => {
    const classes = useStyles()
    const [anchorEl, setAnchorEl] = useState()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(event.currentTarget)
    }

    const getInitials = (name: string) => name
        .split(' ')
        .filter((n, i, a) => i === 0 || i === a.length - 1)
        .map(n => n[0].toUpperCase())

    const chip = (
        <Chip
            avatar={ <Avatar>{ getInitials(poc.name) }</Avatar> }
            label={ poc.name }
            deleteIcon={ <Info fontSize="small"/> }
            onDelete={ handleClick }/>
    )

    const renderValue = (key: keyof Stakeholder) => {
        if (poc[key]) {
            return (
                <Value
                    key={ key }
                    label={ key }
                    value={
                        <span className={ classes.value }>
                            <span>{ poc[key] }</span>
                            <Tooltip title={ `Copy ${key}` }>
                                <FileCopy style={ { cursor: 'pointer' } } fontSize="small" onClick={ () => onCopy(key, poc[key] as string) }/>
                            </Tooltip>
                        </span>
                    }/>
            )
        }
    }

    const popover = (
        <Popover open={ !!anchorEl } anchorEl={ anchorEl } onClose={ () => setAnchorEl(null) }>
            <Paper className={ classes.popper }>
                { (['name', 'email', 'phone'] as Array<keyof Stakeholder>).map(renderValue) }
            </Paper>
        </Popover>
    )

    return (
        <>
            { chip }
            { popover }
        </>
    )
}

export default VendorPage
