import React, { useState } from 'react'
import copy from 'copy-to-clipboard'

import { CustomPaging, DataTypeProvider } from '@devexpress/dx-react-grid'
import { Grid as DevExGrid, PagingPanel, Table, TableColumnResizing, TableColumnVisibility, TableFilterRow, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import { makeStyles, Theme } from '@material-ui/core/styles'
import { IconButton, Snackbar, Tooltip } from '@material-ui/core'
import { Add, FileCopy } from '@material-ui/icons'

import Async from 'Components/Async'
import ChoiceFilter from 'Components/ChoiceFilter'
import ColumnDropdown from 'Components/ColumnDropdown'
import ColumnSizeManager from 'Components/ColumnSizeManager'
import Date from 'Components/Date'
import DateFilter from 'Components/DateFilter'
import PageHeader from 'Components/PageHeader'

import { loadVendors } from 'Api'
import { getTableState, usePageData, usePermission, useTableState } from 'Util'
import { pageSizeOptions } from 'Constants'
import { AsyncPageData, Vendor } from 'Types'

interface VendorListProps {
    onAddVendor: () => void
    onChooseVendor: (pk: string) => void
}

const useStyles = makeStyles((theme: Theme) => ({
    grow: {
        flexGrow: 1
    },
    divider: {
        backgroundColor: theme.palette.secondary.light,
        width: '2px',
        height: '35px',
        margin: theme.spacing(1)
    },
    table: {
        position: 'relative'
    },
    message: {
        position: 'absolute',
        left: 0,
        right: 0,
        margin: 'auto',
        top: '120px'
    },
    copy: {
        marginLeft: theme.spacing(1)
    },
    row: {
        '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            cursor: 'pointer'
        }
    }
}))

const CellComponent = (props: TableFilterRow.CellProps) => {
    if (['dateAdded'].includes(props.column.name)) {
        return <DateFilter { ...props }/>
    }
    if (['autoApprove'].includes(props.column.name)) {
        return <ChoiceFilter { ...props } options={ ['yes', 'no'] }/>
    }
    return <TableFilterRow.Cell { ...props }/>
}

const filterExtensions = [
    { columnName: 'fileCount', filteringEnabled: false }
]

const sortingExtensions = [
    { columnName: 'pocs', sortingEnabled: false }
]

const VendorList = ({ onAddVendor, onChooseVendor }: VendorListProps) => {
    const classes = useStyles()
    const addEnabled = usePermission('add_vendor')
    const [copySnackbarOpen, setCopySnackbarOpen] = useState(false)

    const tableState = useTableState({ initialSort: [{ columnName: 'name', direction: 'asc' }] })
    const vendors = usePageData(() => loadVendors(tableState), tableState.deps)

    const columns = [
        { name: 'name', title: 'Name', ratio: 2 },
        { name: 'code', title: 'Code', ratio: 2 },
        { name: 'dateAdded', title: 'Date Added', ratio: 1 },
        { name: 'fileCount', title: 'File Count', ratio: 1 },
        { name: 'pocs', title: 'Point(s) of contact', ratio: 2 },
        { name: 'autoApprove', title: 'Auto-approve', ratio: 1 },
        { name: 'approvalRegex', title: 'Approval Regex', ratio: 1 }
    ]

    const copyCode = (e: React.MouseEvent<HTMLElement>, code: string) => {
        e.stopPropagation()
        copy(code)
        setCopySnackbarOpen(true)
    }

    const CodeFormatter = ({ value }: { value: string }) =>
        <>
            <span>{ value }</span>
            <Tooltip title="Copy vendor code">
                <IconButton className={ classes.copy } onClick={ e => copyCode(e, value) } size="small">
                    <FileCopy fontSize="inherit"/>
                </IconButton>
            </Tooltip>
        </>

    const transformData = (vendors: AsyncPageData<Vendor[]>) =>
        vendors.error ? [] : vendors.data.map(v => ({
            ...v,
            pocs: v.pocs && v.pocs.map(p => p.name).join(', ')
        }))

    const Row = (props: Table.DataRowProps) => (
        <Table.Row
            { ...props }
            className={ classes.row }
            onClick={ () => onChooseVendor(props.row.pk) }/>
    )

    const pageTitle = `Vendors (${vendors.total})`

    return (
        <>
            <ColumnSizeManager columns={ columns } tableKey="vendorList">
                { ({ onUserResize, columnSizes, measureRef, fitColumnButton }) =>
                    <>
                        <PageHeader title={ pageTitle }>
                            <div className={ classes.grow }/>
                            { addEnabled &&
                                <Tooltip title="Create">
                                    <IconButton color="inherit" onClick={ onAddVendor }>
                                        <Add/>
                                    </IconButton>
                                </Tooltip>
                            }
                            <div className={ classes.divider }/>
                            { fitColumnButton }
                            <ColumnDropdown columns={ columns } selection={ tableState.columns } onSelect={ tableState.setColumns }/>
                        </PageHeader>
                        <div className={ classes.table } ref={ measureRef }>
                            <DevExGrid
                                rows={ transformData(vendors) }
                                columns={ columns }>
                                { getTableState(tableState, { filterExtensions, sortingExtensions }) }
                                <CustomPaging totalCount={ vendors.total }/>
                                <DataTypeProvider for={ ['dateAdded'] } formatterComponent={ ({ value }) => value && <Date date={ value }/> }/>
                                <DataTypeProvider for={ ['autoApprove'] } formatterComponent={ ({ value }) => <span>{ value ? 'Yes' : 'No' }</span> }/>
                                <DataTypeProvider for={ ['code'] } formatterComponent={ CodeFormatter }/>
                                <Table rowComponent={ Row } messages={ { noData: (!vendors.loading && !vendors.error) ? 'No data' : undefined } }/>
                                <TableColumnVisibility hiddenColumnNames={ tableState.columns }/>
                                <TableColumnResizing columnWidths={ columnSizes } onColumnWidthsChange={ onUserResize }/>
                                <TableHeaderRow showSortingControls/>
                                <TableFilterRow cellComponent={ CellComponent }/>
                                <PagingPanel pageSizes={ pageSizeOptions }/>
                            </DevExGrid>
                            <span className={ classes.message }>
                                <Async state={ vendors } errorMessage="Failed to load vendors"/>
                            </span>
                        </div>
                    </>
                }
            </ColumnSizeManager>
            <Snackbar
                open={ copySnackbarOpen }
                autoHideDuration={ 3000 }
                message="Vendor code copied to clipboard"
                onClose={ () => setCopySnackbarOpen(false) }/>
        </>
    )
}

export default VendorList
