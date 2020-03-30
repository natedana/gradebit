import React, { useState } from 'react'

import { Checkbox, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core'
import { VisibilityOff } from '@material-ui/icons'

import { Column } from '@devexpress/dx-react-grid'

interface ColumnChooserProps {
    columns: Column[]
    selection: string[]
    onSelect: (newCols: string[]) => void
}

const ColumnChooser = (props: ColumnChooserProps) => {
    const [anchorEl, setAnchor] = useState()
    const [selected, setSelected] = useState<string[]>([])

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSelected(props.selection)
        setAnchor(event.currentTarget)
    }

    const handleClose = () => {
        setAnchor(undefined)
        props.onSelect(selected)
    }

    const selectOption = (c: Column) => {
        setSelected(s => {
            if (s.includes(c.name)) {
                return s.filter(col => col !== c.name)
            } else {
                return [...s, c.name]
            }
        })
    }

    return (
        <>
            <Tooltip title="Column visibility" placement="bottom">
                <IconButton color="inherit" onClick={ handleClick }>
                    <VisibilityOff/>
                </IconButton>
            </Tooltip>
            <Menu
                id="menu-account"
                anchorEl={ anchorEl }
                getContentAnchorEl={ null }
                anchorOrigin={ {
                    vertical: 'bottom',
                    horizontal: 'right'
                } }
                open={ !!anchorEl }
                onClose={ handleClose }>
                { props.columns.map(c => (
                    <MenuItem key={ c.name } onClick={ () => selectOption(c) }>
                        <Checkbox readOnly checked={ !selected.includes(c.name) }/>
                        { c.title }
                    </MenuItem>
                )) }
            </Menu>
        </>
    )
}

export default ColumnChooser
