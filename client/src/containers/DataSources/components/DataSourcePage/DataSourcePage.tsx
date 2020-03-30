import React, { ReactNode } from 'react'
import { RouteComponentProps } from 'react-router'
import { titleCase } from 'change-case'

import { Grid, IconButton, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Delete, Edit } from '@material-ui/icons'

import PageHeader from 'Components/PageHeader'
import Date from 'Components/Date'
import Async from 'Components/Async'
import Value from 'Components/Value'
import ErrorSnackbar from 'Components/ErrorSnackbar'
import LoadingIconButton from 'Components/LoadingIconButton'

import Notes from './Notes'

import { useApi, useApiData } from 'Util'
import { loadDataSource } from 'Api'
import { DataSource } from 'Types'

interface FilePageProps extends RouteComponentProps<{ dataSourcePk: string }> {
    onEditDataSource: (pk: string) => void
    onDeleteDataSource: (pk: string) => Promise<void>
}

const useStyles = makeStyles({
    grow: {
        flexGrow: 1
    }
})

const dateValue = (date: string) => <Date date={ date }/>

const FilePage = ({ match, onDeleteDataSource, onEditDataSource }: FilePageProps) => {
    const { dataSourcePk } = match.params
    const classes = useStyles()
    const dataSource = useApiData(() => loadDataSource(dataSourcePk), [dataSourcePk])

    const del = useApi(async () => {
        if (confirm('Are you sure you want to delete this datasource?')) {
            await onDeleteDataSource(dataSource.data!.pk!)
        }
    }, [dataSource.data, onDeleteDataSource])

    const values: Array<[keyof DataSource, ((v: any) => ReactNode)?]> = [
        ['dataOrigin'],
        ['dataType'],
        ['entities'],
        ['priority'],
        ['portfolio'],
        ['status'],
        ['dateInformation', dateValue],
        ['dateIngest', dateValue],
        ['frequency'],
        ['leads'],
        ['requestMethod'],
        ['theme'],
        ['updatePeriodically']
    ]

    return (
        <Async state={ dataSource } errorMessage="Failed to load data source">
            { data =>
                <>
                    <PageHeader title={ data.name }>
                        <div className={ classes.grow }/>
                        <Tooltip title="Edit">
                            <IconButton color="inherit" onClick={ () => onEditDataSource(data.pk!) }>
                                <Edit/>
                            </IconButton>
                        </Tooltip>
                        <LoadingIconButton { ...del } title="Delete" icon={ <Delete/> }/>
                    </PageHeader>
                    <Grid container spacing={ 1 }>
                        { values.map(([key, func]) => (
                            <Value key={ key } label={ titleCase(key) } value={ func ? func(data[key]) : data[key] }/>
                        )) }
                    </Grid>
                    <Notes dataSourcePk={ dataSourcePk }/>
                    <ErrorSnackbar
                        open={ !!del.error }
                        clearError={ del.clearError }
                        message="Failed to delte datasource"/>
                </>
            }
        </Async>
    )
}

export default FilePage
