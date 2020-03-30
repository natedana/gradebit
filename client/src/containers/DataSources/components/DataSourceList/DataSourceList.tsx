import React, { ReactText, useState } from 'react'
import { titleCase } from 'change-case'

import { CustomPaging, DataTypeProvider, IntegratedSelection, SelectionState } from '@devexpress/dx-react-grid'
import { Grid as DevExGrid, PagingPanel, Table, TableColumnResizing, TableColumnVisibility, TableFilterRow, TableHeaderRow, TableSelection } from '@devexpress/dx-react-grid-material-ui'
import { IconButton, Tooltip } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'
import { Add, Delete, Refresh } from '@material-ui/icons'

import Async from 'Components/Async'
import ColumnDropdown from 'Components/ColumnDropdown'
import ColumnSizeManager from 'Components/ColumnSizeManager'
import Date from 'Components/Date'
import LoadingIconButton from 'Components/LoadingIconButton'
import ErrorSnackbar from 'Components/ErrorSnackbar'
import PageHeader from 'Components/PageHeader'

import { getTableState, pluralize, useApi, usePageData, useTableState } from 'Util'
import { deleteDataSources, loadDataSources } from 'Api'
import { pageSizeOptions } from 'Constants'

interface FileListProps {
    onChooseDataSource: (pK: string) => void
    onAddDataSource: () => void
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
    row: {
        '&:hover': {
            backgroundColor: theme.palette.secondary.light,
            cursor: 'pointer'
        }
    }
}))

const DataSourceList = ({ onChooseDataSource, onAddDataSource }: FileListProps) => {
    const [selection, setSelection] = useState<ReactText[]>([])
    const classes = useStyles()

    const tableState = useTableState({ initialSort: [{ columnName: 'name', direction: 'asc' }] })
    const dataSources = usePageData(() => loadDataSources(tableState), tableState.deps)

    const handleSelection = (rowSelection: ReactText[]) => {
        setSelection(rowSelection)
    }

    const delDatasources = useApi(async () => {
        const r = confirm(`Are you sure you want to delete ${pluralize('this data source', selection.length, 'these data sources')}?`)
        if (r === true) {
            const pksToDelete = selection.map(s => dataSources.data[s as number].pk)
            await deleteDataSources(pksToDelete)
            setSelection([])
            dataSources.reload()
        }
    }, [dataSources, selection])

    const columns = [
        { name: 'name', title: 'Name', ratio: 1 },
        { name: 'status', title: 'Status', ratio: 1 },
        { name: 'priority', title: 'Priority', ratio: 1 },
        { name: 'theme', title: 'Theme', ratio: 1 },
        { name: 'dateInformation', title: 'Info', ratio: 1 },
        { name: 'dateIngest', title: 'Ingest', ratio: 1 }
    ]

    const Row = (props: Table.DataRowProps) => (
        <Table.Row
            { ...props }
            className={ classes.row }
            onClick={ () => onChooseDataSource(props.row.pk) }/>
    )

    return (
        <>
            <ColumnSizeManager columns={ columns } tableKey="dataSourceList">
                { ({ columnSizes, onUserResize, measureRef, fitColumnButton }) =>
                    <>
                        <PageHeader title="Data Sources">
                            <div className={ classes.grow }/>
                            <LoadingIconButton { ...delDatasources } title="Delete" visible={ selection.length > 0 } icon={ <Delete/> }/>
                            <LoadingIconButton submit={ dataSources.reload } loading={ dataSources.loading } title="Refresh" visible={ selection.length > 0 } icon={ <Refresh/> }/>
                            <Tooltip title="Create">
                                <IconButton color="inherit" onClick={ onAddDataSource }>
                                    <Add/>
                                </IconButton>
                            </Tooltip>
                            <div className={ classes.divider }/>
                            { fitColumnButton }
                            <ColumnDropdown columns={ columns } selection={ tableState.columns } onSelect={ tableState.setColumns }/>
                        </PageHeader>
                        <div className={ classes.table } ref={ measureRef }>
                            <DevExGrid
                                rows={ dataSources.error ? [] : dataSources.data }
                                columns={ columns }>
                                <SelectionState selection={ selection } onSelectionChange={ handleSelection }/>
                                { getTableState(tableState) }
                                <CustomPaging totalCount={ dataSources.total }/>
                                <IntegratedSelection/>
                                <DataTypeProvider for={ ['dateInformation', 'dateIngest'] } formatterComponent={ ({ value }) => value && <Date date={ value }/> }/>
                                <DataTypeProvider for={ ['status'] } formatterComponent={ ({ value }) => <span>{ titleCase(value) }</span> }/>
                                <Table rowComponent={ Row } messages={ { noData: (!dataSources.loading && !dataSources.error) ? 'No data' : undefined } }/>
                                <TableColumnVisibility hiddenColumnNames={ tableState.columns }/>
                                <TableColumnResizing columnWidths={ columnSizes } onColumnWidthsChange={ onUserResize }/>
                                <TableSelection showSelectAll/>
                                <TableHeaderRow showSortingControls/>
                                <TableFilterRow/>
                                <PagingPanel pageSizes={ pageSizeOptions }/>
                            </DevExGrid>
                            <span className={ classes.message }>
                                <Async state={ dataSources } errorMessage="Failed to load data sources"/>
                            </span>
                        </div>
                    </>
                }
            </ColumnSizeManager>
            <ErrorSnackbar
                open={ !!delDatasources.error }
                clearError={ delDatasources.clearError }
                message="Failed to delete data sources"/>
        </>
    )
}

export default DataSourceList
