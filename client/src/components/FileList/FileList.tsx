import React, { ReactText, useState } from 'react'
import { titleCase } from 'change-case'
import filesize from 'filesize'
import copy from 'copy-to-clipboard'

import { CustomPaging, DataTypeProvider, IntegratedSelection, SelectionState } from '@devexpress/dx-react-grid'
import { Grid as DevExGrid, PagingPanel, Table, TableColumnResizing, TableColumnVisibility, TableFilterRow, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui'
import { IconButton, Snackbar, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Delete, Done, FileCopy, Refresh, SettingsBackupRestore, ThumbDown } from '@material-ui/icons'

import { combineErrors, getTableState, pluralize, useApi, usePageData, useTableState } from 'Util'

import Async from 'Components/Async'
import ColumnDropdown from 'Components/ColumnDropdown'
import ColumnSizeManager from 'Components/ColumnSizeManager'
import ConfirmPopper from 'Components/ConfirmPopper'
import DateComponent from 'Components/Date'
import DateFilter from 'Components/DateFilter'
import ErrorSnackbar from 'Components/ErrorSnackbar'
import PageHeader from 'Components/PageHeader'
import { MultiChoiceFilter } from 'Components/ChoiceFilter'
import LoadingIconButton from 'Components/LoadingIconButton'

import { approveFiles, deleteFiles, loadFiles, rejectFiles, retryFiles } from 'Api'
import { Status, Vendor } from 'Types'
import { usePermission } from 'Util'
import { pageSizeOptions } from 'Constants'

interface FileListProps {
    onChooseFile: (pk: string) => void
    extraActions?: React.ReactNode
    vendor?: Vendor
    children?: React.ReactNode
}

const useStyles = makeStyles(theme => ({
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
    pocs: {
        marginTop: theme.spacing(2)
    },
    copy: {
        marginLeft: theme.spacing(1)
    },
    tooltip: {
        wordBreak: 'break-all'
    },
    row: {
        '&:hover': {
            backgroundColor: theme.palette.secondary.light,
            cursor: 'pointer'
        }
    },
    fileHeader: {
        marginTop: theme.spacing(1)
    }
}))

const defaultFilter = [Status.Approved, Status.Clean, Status.Failed, Status.Rejected, Status.Quarantined, Status.Unscanned].join(',')

const CellComponent = (props: TableFilterRow.CellProps) => {
    if (['dateUploaded', 'dateApproved'].includes(props.column.name)) {
        return <DateFilter { ...props }/>
    }
    if (props.column.name === 'status') {
        return <MultiChoiceFilter { ...props } options={ Object.values(Status) }/>
    }
    return <TableFilterRow.Cell { ...props }/>
}

const FileList = ({ vendor, onChooseFile, children, extraActions }: FileListProps) => {
    const [selection, setSelection] = useState<ReactText[]>([])
    const [copySnackbarOpen, setCopySnackbarOpen] = useState(false)

    const classes = useStyles()
    const changeAllowed = usePermission('change_file')

    const tableState = useTableState({ initialSort: [{ columnName: 'dateUploaded', direction: 'desc' }], initialFilter: [{ columnName: 'status', value: defaultFilter }] })
    const files = usePageData(() => loadFiles(tableState, vendor && vendor.code), [...tableState.deps, vendor && vendor.code])

    const handleSelection = (rowSelection: ReactText[]) => {
        setSelection(rowSelection)
    }

    const retry = useApi(async () => {
        const filesToRetry = selection.map(s => files.data[s as number]).filter(f => f.status === Status.Failed)
        await retryFiles(filesToRetry.map(f => f.pk))
        setSelection([])
        files.reload()
    }, [files, selection])

    const approve = useApi(async () => {
        const filesToApprove = selection.map(s => files.data[s as number]).filter(f => f.status === Status.Clean)
        await approveFiles(filesToApprove.map(f => f.pk))
        setSelection([])
        files.reload()
    }, [files, selection])

    const reject = useApi(async (message: string) => {
        const filesToReject = selection.map(s => files.data[s as number]).filter(f => f.status === Status.Clean || f.status === Status.Unscanned)
        await rejectFiles(filesToReject.map(f => f.pk), message)
        setSelection([])
        files.reload()
    }, [files, selection])

    const delFiles = useApi(async () => {
        const r = confirm(`Are you sure you want to delete ${pluralize('this file', selection.length, 'these files')}?`)
        if (r === true) {
            const pksToDelete = selection.map(s => files.data[s as number].pk)
            await deleteFiles(pksToDelete)
            setSelection([])
            files.reload()
        }
    }, [files, selection])

    const handleCopyVendor = (e: React.MouseEvent<HTMLElement>, vendor: Vendor) => {
        e.stopPropagation()
        copy(vendor.code)
        setCopySnackbarOpen(true)
    }

    const columns = [
        { name: 'name', title: 'Name', ratio: 3 },
        { name: 'url', title: 'URL', ratio: 2 },
        { name: 'status', title: 'Status', ratio: 1 },
        { name: 'size', title: 'Size', ratio: 1 },
        { name: 'vendor', title: 'Vendor', ratio: 2 },
        { name: 'submitter', title: 'Submitter', ratio: 2 },
        { name: 'dateUploaded', title: 'Upload Date', ratio: 1 },
        { name: 'dateApproved', title: 'Approval Date', ratio: 1 },
        { name: 'priority', title: 'Priority', ratio: 1 }
    ]

    const tooltipCells = [ 'name', 'url', 'submitter' ]

    const TooltipCell = (props: Table.DataCellProps) => (
        <Table.Cell { ...props }>
            <Tooltip title={ <div className={ classes.tooltip }>{ props.value }</div> }>
                <span>
                    { props.value }
                </span>
            </Tooltip>
        </Table.Cell>
    )

    const Row = (props: Table.DataRowProps) => (
        <Table.Row
            { ...props }
            className={ classes.row }
            onClick={ () => onChooseFile(props.row.pk) }/>
    )

    const Cell = (props: Table.DataCellProps) => {
        const { column } = props
        if (tooltipCells.indexOf(column.name) > -1) {
            return <TooltipCell { ...props }/>
        }
        return <Table.Cell { ...props }/>
    }

    const VendorFormatter = ({ value }: { value: Vendor }) =>
        <>
            <Tooltip title={ <div className={ classes.tooltip }>{ value.name }</div> }>
                <span>{ titleCase(value.name) }</span>
            </Tooltip>
            <Tooltip title="Copy vendor code">
                <IconButton className={ classes.copy } onClick={ e => handleCopyVendor(e, value) } size="small">
                    <FileCopy fontSize="inherit"/>
                </IconButton>
            </Tooltip>
        </>

    const pageTitle = vendor ? vendor.name : `Files (${files.total})`
    const err = combineErrors([retry, 'Failed to retry files'], [approve, 'Failed to approve files'], [delFiles, 'Failed to delete files'])
    const selectedFiles = selection.map(s => files.data[s as number])
    const failedFiles = selectedFiles.filter(f => f && f.status === Status.Failed).length > 0
    const cleanFiles = selectedFiles.filter(f => f && f.status === Status.Clean).length > 0
    const unscannedFiles = selectedFiles.filter(f => f && f.status === Status.Unscanned).length > 0

    return (
        <>
            <ColumnSizeManager columns={ columns } tableKey="fileList" offset={ 60 }>
                { ({ columnSizes, onUserResize, fitColumnButton, measureRef }) => (
                    <>
                        <PageHeader title={ pageTitle }>
                            <div className={ classes.grow }/>
                            { extraActions }
                            <LoadingIconButton { ...retry } title="Retry" visible={ failedFiles } icon={ <SettingsBackupRestore/> }/>
                            <LoadingIconButton { ...approve } title="Approve" visible={ changeAllowed && cleanFiles } icon={ <Done/> }/>
                            <LoadingIconButton { ...delFiles } title="Delete" visible={ selection.length > 0 } icon={ <Delete/> }/>
                            <ConfirmPopper
                                title="Reject"
                                icon={ <ThumbDown/> }
                                submit={ reject.submit }
                                invisible={ !(cleanFiles || unscannedFiles) || !changeAllowed }
                                prompt="Want to add a message?"/>
                            <LoadingIconButton submit={ files.reload } loading={ files.loading } title="Refresh" icon={ <Refresh/> }/>
                            <div className={ classes.divider }/>
                            { fitColumnButton }
                            <ColumnDropdown columns={ columns } selection={ tableState.columns } onSelect={ tableState.setColumns }/>
                        </PageHeader>
                        { children }
                        <div className={ classes.table } ref={ measureRef }>
                            <DevExGrid
                                rows={ files.error ? [] : files.data }
                                columns={ columns }>
                                <SelectionState selection={ selection } onSelectionChange={ handleSelection }/>
                                { getTableState(tableState) }
                                <CustomPaging totalCount={ files.total }/>
                                <IntegratedSelection/>
                                <DataTypeProvider for={ ['size'] } formatterComponent={ ({ value }) => <span>{ filesize(value) }</span> }/>
                                <DataTypeProvider for={ ['dateUploaded', 'dateApproved'] } formatterComponent={ ({ value }) => value && <DateComponent date={ value }/> }/>
                                <DataTypeProvider for={ ['status'] } formatterComponent={ ({ value }) => <span>{ titleCase(value) }</span> }/>
                                <DataTypeProvider for={ ['vendor'] } formatterComponent={ VendorFormatter }/>
                                <Table rowComponent={ Row } cellComponent={ Cell } messages={ { noData: (!files.loading && !files.error) ? 'No data' : undefined } }/>
                                <TableColumnVisibility hiddenColumnNames={ tableState.columns }/>
                                <TableColumnResizing columnWidths={ columnSizes } onColumnWidthsChange={ onUserResize }/>
                                <TableSelection showSelectAll/>
                                <TableHeaderRow showSortingControls/>
                                <TableFilterRow cellComponent={ CellComponent }/>
                                <PagingPanel pageSizes={ pageSizeOptions }/>
                            </DevExGrid>
                            <span className={ classes.message }>
                                <Async state={ files } errorMessage="Failed to load files"/>
                            </span>
                        </div>
                    </>
                ) }
            </ColumnSizeManager>
            <Snackbar
                open={ copySnackbarOpen }
                autoHideDuration={ 3000 }
                message="Vendor code copied to clipboard"
                onClose={ () => setCopySnackbarOpen(false) }/>
            <ErrorSnackbar { ...err }/>
        </>
    )
}

export default FileList
