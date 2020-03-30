import React from 'react'
import { RouteComponentProps } from 'react-router'
import { titleCase } from 'change-case'
import urlJoin from 'url-join'
import filesize from 'filesize'

import { Grid, IconButton, Link, Tooltip } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'
import { Delete, Done, SaveAlt, SettingsBackupRestore, ThumbDown } from '@material-ui/icons'

import PageHeader from 'Components/PageHeader'
import Date from 'Components/Date'
import Async from 'Components/Async'
import Value from 'Components/Value'
import ErrorSnackbar from 'Components/ErrorSnackbar'
import LoadingIconButton from 'Components/LoadingIconButton'
import ConfirmPopper from 'Components/ConfirmPopper'

import { combineErrors, useApi, useApiData } from 'Util'

import { approveFile, getFileDataUrl, loadFile, rejectFile, retryFile } from 'Api'

import Preview from './Preview'

import { statusWhitelist } from 'Constants'
import { Status, Vendor } from 'Types'
import { usePermission } from 'Util'

const gigSize = Math.pow(10, 9)

interface FilePageProps extends RouteComponentProps<{ fileId: string }> {
    onChooseVendor: (vendor: Vendor) => Promise<void>
    onDeleteFile: (pk: string) => Promise<void>
}

const useStyles = makeStyles((theme: Theme) => ({
    grow: {
        flexGrow: 1
    },
    link: {
        '&:hover': {
            cursor: 'pointer'
        }
    },
    preview: {
        marginTop: theme.spacing(3)
    }
}))

const FilePage = ({ match, onChooseVendor, onDeleteFile }: FilePageProps) => {
    const { fileId } = match.params

    const classes = useStyles()
    const changeAllowed = usePermission('change_file')

    const file = useApiData(() => loadFile(fileId), [fileId])

    const retry = useApi(async (fragmentsInput: string) => {
        const fragments = fragmentsInput.split(',').map(f => f.trim()).filter(f => f)
        await retryFile(file.data!.pk, fragments)
        file.reload()
    }, [file])

    const approve = useApi(async () => {
        await approveFile(file.data!.pk)
        file.reload()
    }, [file])

    const reject = useApi(async (message: string) => {
        await rejectFile(file.data!.pk, message)
        file.reload()
    }, [file])

    const del = useApi(async () => {
        if (confirm('Are you sure you want to delete this file?')) {
            onDeleteFile(file.data!.pk)
        }
    }, [file.data, onDeleteFile])

    const err = combineErrors([retry, 'Failed to retry file'], [approve, 'Failed to approve file'], [del, 'Failed to delete file'], [reject, 'Failed to reject file'])

    return (
        <Async state={ file } errorMessage="Failed to load file">
            { data =>
                <>
                    <PageHeader title={ data.name }>
                        <div className={ classes.grow }/>
                        <ConfirmPopper
                            title="Retry"
                            icon={ <SettingsBackupRestore/> }
                            submit={ retry.submit }
                            preventConfirm={ data.status == Status.Failed }
                            prompt="Please provide the file fragments."
                            invisible={ ![Status.Failed, Status.Transferred].includes(data.status) || !changeAllowed }/>
                        <LoadingIconButton { ...approve } title="Approve" visible={ data.status === Status.Clean && changeAllowed } icon={ <Done/> }/>
                        <LoadingIconButton { ...del } title="Delete" icon={ <Delete/> }/>
                        <ConfirmPopper
                            title="Reject"
                            icon={ <ThumbDown/> }
                            submit={ reject.submit }
                            prompt="Want to add a message?"
                            invisible={ ![Status.Clean, Status.Unscanned].includes(data.status) && !changeAllowed }/>
                        { statusWhitelist.includes(data.status) &&
                            <Tooltip title="Download">
                                <IconButton
                                    download
                                    color="inherit"
                                    href={ getFileDataUrl(data.pk, true) }
                                    target="_blank"
                                    rel="noreferrer">
                                    <SaveAlt/>
                                </IconButton>
                            </Tooltip>
                        }
                    </PageHeader>
                    <Grid container>
                        <Value label="Status" value={ titleCase(data.status) }/>
                        <Value label="Vendor" value={
                            <Link className={ classes.link } color="inherit" onClick={ () => onChooseVendor(data.vendor) }>
                                { data.vendor.name }
                            </Link>
                        }/>
                        <Value label="Submitter" value={ data.submitter }/>
                        <Value label="Priority" value={ data.priority }/>
                        <Value label="Date Uploaded" value={ <Date date={ data.dateUploaded } verbose/> }/>
                        <Value label="Size" value={ filesize(data.size) }/>
                        <Value label="URL" value={ urlJoin(data.location, data.status, data.key) }/>
                    </Grid>
                    { statusWhitelist.includes(data.status) && data.size < gigSize &&
                        <Grid container className={ classes.preview }>
                            <Preview file={ data }/>
                        </Grid>
                    }
                    <ErrorSnackbar { ...err }/>
                </>
            }
        </Async>
    )
}

export default FilePage
