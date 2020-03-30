import React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import useRouter from 'use-react-router'

import { createDataSource, deleteDataSource, editDatasource } from 'Api'
import { DataSource } from 'Types'

import DataSourceList from './components/DataSourceList'
import DataSourceForm from './components/DataSourceForm'
import DataSourcePage from './components/DataSourcePage'

const DataSources = () => {
    const { history, match } = useRouter()

    const handleDeleteDataSource = async (pk: string) => {
        await deleteDataSource(pk)
        history.push(match.url)
    }

    const handleUpdateDataSource = async (ds: DataSource) => {
        await editDatasource(ds)
        history.push(match.url)
    }

    const handleCreateDataSource = async (ds: DataSource) => {
        await createDataSource(ds)
        history.push(match.url)
    }

    const onChooseDataSource = (pk: string) => {
        history.push(`${match.url}/${pk}`)
    }

    const handleEditDataSource = (pk: string) => {
        history.push(`${match.url}/${pk}/edit`)
    }

    const handleAddDataSource = () => {
        history.push(`${match.url}/create`)
    }

    return (
        <Switch>
            <Route exact path={ match.url } render={ () => (
                <DataSourceList onChooseDataSource={ onChooseDataSource } onAddDataSource={ handleAddDataSource }/>
            ) }/>
            <Route exact path={ `${match.url}/create` } render={ props =>
                <DataSourceForm { ...props } onSubmit={ handleCreateDataSource }/>
            }/>
            <Route exact path={ `${match.url}/:dataSourcePk/edit` } render={ props =>
                <DataSourceForm { ...props } onSubmit={ handleUpdateDataSource }/>
            }/>
            <Route exact path={ `${match.url}/:dataSourcePk` } render={ props =>
                <DataSourcePage { ...props }
                    onEditDataSource={ handleEditDataSource }
                    onDeleteDataSource={ handleDeleteDataSource }/>
            }/>
            <Redirect to={ match.url }/>
        </Switch>
    )
}

export default DataSources
