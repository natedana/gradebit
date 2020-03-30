import React, { useEffect, useRef, useState } from 'react'
import Measure, { ContentRect } from 'react-measure'

import { IconButton, Tooltip } from '@material-ui/core'
import { ViewColumn } from '@material-ui/icons'
import { TableColumnWidthInfo } from '@devexpress/dx-react-grid'

import { ColumnInfo } from 'Types'

interface ColumnSizeManagerProps {
    offset?: number
    columns: ColumnInfo[]
    tableKey: string
    children: (props: ColumnSizeProps) => React.ReactElement
}

interface ColumnSizeProps {
    columnSizes: TableColumnWidthInfo[]
    onUserResize: (newSizes: TableColumnWidthInfo[]) => void
    measureRef: (ref: Element | null) => void
    fitColumnButton: React.ReactNode
}

const ColumnSizeManager = function({ children, columns, tableKey, offset = 0 }: ColumnSizeManagerProps) {
    const getInitialSizes = () => columns.map(c => ({ columnName: c.name, width: 100 }))
    const [columnSizes, onColumnSizeChange] = useState<TableColumnWidthInfo[]>(getInitialSizes)
    const fitColumnCalled = useRef(false) // To help manage when columns resized
    const initialLoad = useRef(true)

    useEffect(() => {
        // Load columns from storage - only on mount
        const columnString = localStorage.getItem(tableKey)
        if (columnString && initialLoad.current) {
            initialLoad.current = false
            const storedColumns = JSON.parse(columnString)
            if (storedColumns.length === columns.length) {
                onColumnSizeChange(storedColumns)
            }
        }
        return function unload() {
            // Store columns
            const columnString = JSON.stringify(columnSizes)
            localStorage.setItem(tableKey, columnString)
        }
    }, [columnSizes, tableKey, fitColumnCalled, columns])

    const onResize = (c: ContentRect) => {
        if (fitColumnCalled.current && c.bounds) {
            fitColumnCalled.current = false
            const left = c.bounds.left
            const right = c.bounds.right
            const totalWidth = right - left - offset
            const sum = columns.reduce((sum, c) => c.ratio + sum, 0)
            const newColumns = columns.map(c => ({
                width: (c.ratio / sum) * totalWidth,
                columnName: c.name
            }))
            onColumnSizeChange(newColumns)
        }
    }

    const createfitColumnButton = (measureColumns: () => void) => (
        <Tooltip title="Fit Columns to Screen" placement="bottom">
            <IconButton color="inherit" onClick={ () => {
                measureColumns()
                fitColumnCalled.current = true
            } }>
                <ViewColumn/>
            </IconButton>
        </Tooltip>
    )

    return (
        <Measure bounds onResize={ onResize }>
            { ({ measureRef, measure }) => children({
                columnSizes,
                measureRef,
                onUserResize: onColumnSizeChange,
                fitColumnButton: createfitColumnButton(measure)
            }) }
        </Measure>
    )
}

export default ColumnSizeManager
