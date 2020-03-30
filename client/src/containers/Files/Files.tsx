import React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import useRouter from 'use-react-router'

import { deleteFile } from 'Api'

import FileList from 'Components/FileList'
import FilePage from './components/FilePage'

import { Vendor } from 'Types'

const Files = () => {
    const { history, match } = useRouter()

    const handleDeleteFile = async (pk: string) => {
        await deleteFile(pk)
        history.push(match.url)
    }

    const handleChooseFile = (pk: string) => {
        history.push(`${match.url}/${pk}`)
    }

    const handleChooseVendor = async (vendor: Vendor) => {
        history.push(`/vendors/${vendor.pk}`)
    }

    return (
        <Switch>
            <Route exact path={ match.url } render={ () => (
                <FileList onChooseFile={ handleChooseFile }/>
            ) }/>
            <Route exact path={ `${match.url}/:fileId` } render={ props =>
                <FilePage
                    { ...props }
                    onChooseVendor={ handleChooseVendor }
                    onDeleteFile={ handleDeleteFile }/>
            }/>
            <Redirect to={ match.url }/>
        </Switch>
    )
}

export default Files
