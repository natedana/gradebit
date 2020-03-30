import React, { useState } from 'react'
import { sentenceCase } from 'change-case'

import { MenuItem, Select, Tooltip } from '@material-ui/core'
import { Filter } from '@devexpress/dx-react-grid'
import { TableFilterRow } from '@devexpress/dx-react-grid-material-ui'

interface ChoiceFilterProps extends TableFilterRow.CellProps {
    filter: Filter | null
    options: string[]
}

const ChoiceFilter = (props: ChoiceFilterProps) => {
    const { filter, options, onFilter } = props

    const [value, setValue] = useState<string[]>(filter && filter.value ? filter.value.split(',') : [])
    const [open, setOpen] = useState(false)

    const onChange = (e: React.ChangeEvent<{value?: unknown}>) => {
        const newValue = e.target.value as string[]
        if (newValue[newValue.length - 1] === '') {
            setValue([])
            onFilter({ value: undefined } as any)
            setOpen(false)
        } else {
            setValue(newValue)
        }
    }

    const onOpen = () => {
        setOpen(true)
    }

    const onClose = () => {
        onFilter({ value: value.join(',') } as any)
        setOpen(false)
    }

    const renderValue = (value: any) => {
        if (!value.length) {
            return 'None'
        } else {
            const text = value.map((v: string) => sentenceCase(v)).join(', ')
            return (
                <Tooltip title={ text }><em>{ text }</em></Tooltip>
            )
        }
    }

    return (
        <TableFilterRow.Cell { ...props }>
            <Select fullWidth multiple
                open={ open }
                value={ value }
                onChange={ onChange }
                onOpen={ onOpen }
                onClose={ onClose }
                renderValue={ renderValue }>
                <MenuItem value=""><em>None</em></MenuItem>
                { options.map(option => (
                    <MenuItem key={ option } value={ option }>
                        { sentenceCase(option) }
                    </MenuItem>
                )) }
            </Select>
        </TableFilterRow.Cell>
    )
}

export default ChoiceFilter
