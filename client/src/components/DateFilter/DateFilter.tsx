import React, { useState } from 'react'
import { endOfDay, startOfDay } from 'date-fns'

import { makeStyles } from '@material-ui/core/styles'
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import { TableFilterRow } from '@devexpress/dx-react-grid-material-ui'
import DateFnsUtils from '@date-io/date-fns'

const useStyles = makeStyles(theme => ({
    dateGroup: {
        display: 'flex'
    },
    fromDate: {
        paddingRight: theme.spacing(1)
    },
    toDate: {
        paddingRight: theme.spacing(1)
    }
}))

const DateFilter = (props: TableFilterRow.CellProps) => {
    const { column, onFilter } = props
    const [fromDate, setFromDate] = useState<Date | null>(null)
    const [toDate, setToDate] = useState<Date | null>(null)
    const classes = useStyles()

    return (
        <MuiPickersUtilsProvider utils={ DateFnsUtils }>
            <TableFilterRow.Cell { ...props }>
                <div className={ classes.dateGroup }>
                    <DatePicker
                        clearable
                        autoOk
                        className={ classes.fromDate }
                        placeholder="From"
                        format="M/d/yy"
                        value={ fromDate }
                        shouldDisableDate={ date => !!(date && toDate && date >= toDate) }
                        onChange={ date => setFromDate(date && startOfDay(date)) }
                        onAccept={ date => onFilter({ columnName: `${column.name}_after`, value: date ? date.toISOString() : undefined }) }/>
                    <DatePicker
                        clearable
                        autoOk
                        className={ classes.toDate }
                        placeholder="To"
                        format="M/d/yy"
                        value={ toDate }
                        shouldDisableDate={ date => !!(date && fromDate && date < fromDate) }
                        onChange={ date => setToDate(date && endOfDay(date)) }
                        onAccept={ date => onFilter({ columnName: `${column.name}_before`, value: date ? date.toISOString() : undefined }) }/>
                </div>
            </TableFilterRow.Cell>
        </MuiPickersUtilsProvider>
    )
}

export default DateFilter
