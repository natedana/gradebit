import React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import useRouter from 'use-react-router'

import { createVendor, editVendor } from 'Api'

import ProtectedRoute from 'Components/ProtectedRoute'

import VendorForm from './components/VendorForm'
import VendorPage from './components/VendorPage'
import VendorList from './components/VendorList'

import { WritableVendor } from 'Types'
import { usePermission } from 'Util'

const Vendors = () => {
    const { history, match } = useRouter()
    const addEnabled = usePermission('add_vendor')

    const handleAddVendor = () => {
        history.push(`${match.url}/add`)
    }

    const handleChooseVendor = (pk: string) => {
        history.push(`${match.url}/${pk}`)
    }

    const handleEditVendor = (pk: string) => {
        history.push(`${match.url}/${pk}/edit`)
    }

    const handleChooseFile = (pk: string) => {
        history.push(`/files/${pk}`)
    }

    const handleCreateVendor = async (v: WritableVendor) => {
        await createVendor(v)
        history.push(match.url)
    }

    const handleUpdateVendor = async (v: WritableVendor) => {
        await editVendor(v)
        history.push(match.url)
    }

    return (
        <Switch>
            <Route exact path={ match.url } render={ () => (
                <VendorList onAddVendor={ handleAddVendor } onChooseVendor={ handleChooseVendor }/>
            ) }/>
            <ProtectedRoute enabled={ addEnabled } path={ `${match.url}/add` } render={ props => (
                <VendorForm onSubmit={ handleCreateVendor } { ...props }/>
            ) }/>
            <Route path={ `${match.url}/:vendorPk/edit` } render={ props => (
                <VendorForm onSubmit={ handleUpdateVendor } { ...props }/>
            ) }/>
            <Route exact path={ `${match.url}/:vendorPk` } render={ props =>
                <VendorPage { ...props } onChooseFile={ handleChooseFile } onEditVendor={ handleEditVendor }/>
            }/>
            <Redirect to={ match.url }/>
        </Switch>
    )
}

export default Vendors
