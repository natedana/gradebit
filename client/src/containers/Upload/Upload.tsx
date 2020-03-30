import React, { useCallback, useContext, useEffect, useState } from 'react'
import axios, { CancelTokenSource } from 'axios'

import { makeStyles } from '@material-ui/core/styles'
import { Avatar, Button, LinearProgress, Paper, Snackbar, SnackbarContent, TextField, Theme, Typography } from '@material-ui/core'
import { ButtonProps } from '@material-ui/core/Button'
import { CloudUpload } from '@material-ui/icons'

import { uploadFiles, validateVendor } from 'Api'

import ValidatedTextField from 'Components/ValidatedTextField'

import DropZone from './components/Dropzone'

import { pluralize } from 'Util'
import { s3NameRegex } from 'Constants'
import { UserContext } from 'Contexts'

const useStyles = makeStyles((theme: Theme) => ({
    main: {
        display: 'block',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        [theme.breakpoints.up(400 + theme.spacing(6))]: {
            width: 600,
            marginLeft: 'auto',
            marginRight: 'auto'
        }
    },
    brand: {
        marginTop: theme.spacing(2),
        maxWidth: 500,
        display: 'block',
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    paper: {
        marginTop: theme.spacing(2),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing(2, 3, 3)
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main
    },
    form: {
        width: '100%',
        marginTop: theme.spacing(1)
    },
    button: {
        marginTop: theme.spacing(3)
    },
    indicator: {
        marginTop: theme.spacing(2)
    }
}))

const UploadPage = () => {
    const user = useContext(UserContext)

    const [files, setFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<Error>()
    const [submitter, setSubmitter] = useState(user ? user.firstName : '')
    const [vendorCode, setVendorCode] = useState('')
    const [vendorCodeHelpText, setVendorCodeHelpText] = useState('')
    const [uploadPercentage, setUploadPercentage] = useState(0)
    const [successMessage, setSuccessMessage] = useState('')
    const [renamedFiles, setRenamedFiles] = useState<Array<[string, string]>>([])
    const [cancelSource, setCancelSource] = useState<CancelTokenSource>()

    const classes = useStyles()

    useEffect(() => {
        if (!submitter && user) {
            setSubmitter(user.firstName)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user && user!.firstName])

    const onUploadProgress = (event: any) => {
        setUploadPercentage(event.loaded * 100 / event.total)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSuccessMessage('')
        setUploadError(undefined)
        setVendorCodeHelpText('')
        const source = axios.CancelToken.source()
        setCancelSource(source)
        setUploading(true)

        try {
            const validVendor = await validateVendor(vendorCode)
            if (!validVendor) {
                setVendorCodeHelpText('Invalid vendor code.')
            } else {
                const namesChanged: Array<[string, string]> = await uploadFiles(files, submitter, vendorCode, onUploadProgress, source.token)
                if (namesChanged.length) {
                    setRenamedFiles(namesChanged)
                }
                setSuccessMessage(`Successfully uploaded ${files.length} ${pluralize('file', files.length)}`)
                setFiles([])
            }
        } catch (error) {
            if (!axios.isCancel(error)) {
                setUploadError(Error(`Failed to upload ${pluralize('file', files.length)}`))
            }
        } finally {
            setUploading(false)
            setUploadPercentage(0)
            setCancelSource(undefined)
        }
    }

    const addFiles = useCallback((newFiles: File[]) => {
        setFiles(f => [...f, ...newFiles])
    }, [])

    const removeFiles = (fileIndex: number) => {
        if (!uploading) {
            setFiles(f => f.filter((_, i) => i !== fileIndex))
        }
    }

    const buttonProps: ButtonProps = {
        className: classes.button,
        fullWidth: true,
        variant: 'contained'
    }

    const formDisabled = !submitter || !vendorCode || files.length === 0 || !s3NameRegex.test(submitter)

    const button = (cancelSource && uploading) ?
        <Button { ...buttonProps }
            key="cancel"
            type="button"
            onClick={ () => cancelSource.cancel() }
            color="secondary">
            Cancel
        </Button>
        :
        <Button { ...buttonProps }
            type="submit"
            color="primary"
            key="submit"
            disabled={ formDisabled }>
            Upload
        </Button>

    return (
        <div className={ classes.main }>
            <Paper className={ classes.paper }>
                <Avatar className={ classes.avatar }>
                    <CloudUpload/>
                </Avatar>
                <Typography variant="h5">
                    Upload
                </Typography>
                <form onSubmit={ handleSubmit } className={ classes.form }>
                    <ValidatedTextField
                        fullWidth
                        autoFocus
                        required
                        margin="normal"
                        id="submitter"
                        label="Submitter Name"
                        regex={ s3NameRegex }
                        errorMessage="Invalid value"
                        value={ submitter }
                        onChange={ e => setSubmitter(e.currentTarget.value) }/>
                    <TextField
                        fullWidth
                        required
                        margin="normal"
                        id="code"
                        label="Vendor Code"
                        helperText={ vendorCodeHelpText }
                        error={ !!vendorCodeHelpText }
                        value={ vendorCode }
                        inputProps={ { maxLength: 8 } }
                        onChange={ e => setVendorCode(e.target.value) }/>
                    <DropZone files={ files } onAdd={ addFiles } onDelete={ removeFiles }/>
                    { button }
                    { uploading &&
                        <LinearProgress
                            className={ classes.indicator }
                            variant="determinate"
                            value={ uploadPercentage }/>
                    }
                    { uploadError &&
                        <Typography className={ classes.indicator } align="center" color="error">
                            { uploadError.message }
                        </Typography>
                    }
                    { successMessage &&
                        <Typography className={ classes.indicator } align="center" color="inherit">
                            { successMessage }
                        </Typography>
                    }
                    <Snackbar
                        open={ renamedFiles.length > 0 }
                        autoHideDuration={ 3000 }
                        onClose={ () => setRenamedFiles([]) }
                        anchorOrigin={ {
                            vertical: 'bottom',
                            horizontal: 'right'
                        } }>
                        <SnackbarContent message={
                            <>
                                <Typography>Files renamed</Typography>
                                <p>&#8226;{ renamedFiles.map(name => (`${name[0]} already exists and was renamed to ${name[1]}`)) }</p>
                            </>
                        }/>
                    </Snackbar>
                </form>
            </Paper>
        </div>
    )
}

export default UploadPage
