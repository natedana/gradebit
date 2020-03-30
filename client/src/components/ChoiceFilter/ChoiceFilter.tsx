import React from 'react'
import { sentenceCase } from 'change-case'

import { MenuItem, TextField } from '@material-ui/core'
import { TableFilterRow } from '@devexpress/dx-react-grid-material-ui'

interface ChoiceFilterProps extends TableFilterRow.CellProps {
    options: string[]
}

const ChoiceFilter = (props: ChoiceFilterProps) => {
    const { filter, options, onFilter } = props
    return (
        <TableFilterRow.Cell { ...props }>
            <TextField
                select
                fullWidth
                value={ filter && filter.value || '' }
                onChange={ e => {
                    console.log(e.target.value)
                    onFilter({ value: e.target.value || undefined } as any)
                } }>
                <MenuItem value=""><em>None</em></MenuItem>
                { options.map(option => (
                    <MenuItem key={ option } value={ option }>
                        { sentenceCase(option) }
                    </MenuItem>
                )) }
            </TextField>
        </TableFilterRow.Cell>
    )
}

export default ChoiceFilter
