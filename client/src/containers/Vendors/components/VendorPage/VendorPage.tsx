import React, { useState } from 'react'
import copy from 'copy-to-clipboard'
import { RouteComponentProps } from 'react-router'

import { Grid, IconButton, Snackbar, Tooltip, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Edit, FileCopy } from '@material-ui/icons'

import { loadVendor } from 'Api'
import { useApiData } from 'Util'

import FileList from 'Components/FileList'
import Async from 'Components/Async'
import Value from 'Components/Value'

import PocChip from './PocChip'

interface VendorPageProps extends RouteComponentProps<{ vendorPk: string }> {
    onChooseFile: (pk: string) => void
    onEditVendor: (pk: string) => void
}

const useStyles = makeStyles(theme => ({
    pocs: {
        marginTop: theme.spacing(3)
    },
    chip: {
        marginRight: theme.spacing(1)
    },
    copy: {
        marginLeft: theme.spacing(1)
    },
    files: {
        marginTop: theme.spacing(3)
    }
}))

const VendorPage = ({ match, onChooseFile, onEditVendor }: VendorPageProps) => {
    const classes = useStyles()
    const { vendorPk } = match.params
    const [copyMessage, setCopyMessage] = useState('')

    const vendor = useApiData(() => loadVendor(vendorPk), [vendorPk])

    const editAction =
        <Tooltip title="Edit">
            <IconButton color="inherit" onClick={ () => onEditVendor(vendor.data!.pk!) }>
                <Edit/>
            </IconButton>
        </Tooltip>

    const copyCode = (e: React.MouseEvent<HTMLElement>, code: string) => {
        e.stopPropagation()
        copy(code)
        setCopyMessage('Successfully copied vendor code.')
    }

    const onCopyPocValue = (label: string, value: string) => {
        copy(value)
        setCopyMessage(`Successfully copied ${label}.`)
    }

    const codeValue = (code: string) =>
        <>
            <span>{ code }</span>
            <Tooltip title="Copy vendor code">
                <IconButton className={ classes.copy } onClick={ e => copyCode(e, code) } size="small">
                    <FileCopy fontSize="inherit"/>
                </IconButton>
            </Tooltip>
        </>

    return (
        <Async state={ vendor } errorMessage="Failed to load vendor">
            { data => (
                <FileList vendor={ vendor.data } onChooseFile={ onChooseFile } extraActions={ editAction }>
                    <Grid container spacing={ 1 }>
                        <Value label="Vendor code" value={ codeValue(data.code) }/>
                        <Value label="Short name" value={ data.shortName }/>
                        <Value label="Priority" value={ data.priority }/>
                        <Value label="Auto approve" value={ data.autoApprove ? 'Yes' : 'No' }/>
                        <Value label="Approval regex" value={ data.approvalRegex }/>
                        <Value label="File count" value={ data.fileCount }/>
                    </Grid>
                    { data.pocs.length > 0 &&
                        <>
                            <Typography variant="h6" className={ classes.pocs }>Point(s) of contact</Typography>
                            { data.pocs.map((poc => <PocChip poc={ poc } key={ poc.pk } onCopy={ onCopyPocValue }/>)) }
                        </>
                    }
                    <Typography variant="h6" className={ classes.files }>Files</Typography>
                    <Snackbar
                        open={ !!copyMessage }
                        autoHideDuration={ 3000 }
                        message={ copyMessage }
                        onClose={ () => setCopyMessage('') }/>
                </FileList>
            ) }
        </Async>
    )
}

export default VendorPage
