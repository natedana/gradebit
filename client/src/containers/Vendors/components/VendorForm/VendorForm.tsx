import React, { useState } from 'react'
import { Prompt, RouteComponentProps } from 'react-router'
import uuid from 'uuid'

import { Checkbox, Container, FormControlLabel, Grid, IconButton, Paper, Radio, RadioGroup, TextField, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Add } from '@material-ui/icons'

import LoadingButton from 'Components/LoadingButton'
import ValidatedTextField from 'Components/ValidatedTextField'
import ErrorSnackBar from 'Components/ErrorSnackbar'
import Async from 'Components/Async'

import { s3NameRegex } from 'Constants'
import { loadStakeholders, loadVendor } from 'Api'
import { isValidPriority, isValidRegex, useApi, useApiData } from 'Util'
import { Stakeholder, Vendor, WritableVendor } from 'Types'

import PointOfContact from './PointOfContact'

interface VendorFormProps extends RouteComponentProps<{ vendorPk: string }> {
    onSubmit: (v: WritableVendor) => void
}

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2, 3, 3)
    },
    form: {
        width: '100%'
    },
    title: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1)
    },
    group: {
        marginLeft: theme.spacing(3)
    },
    submit: {
        marginTop: theme.spacing(3),
        marginLeft: 'auto'
    }
}))

const VendorForm = ({ onSubmit, match }: VendorFormProps) => {
    const vendorPk = match && match.params && match.params.vendorPk
    const title = (vendorPk ? 'Edit' : 'New') + ' Vendor'
    const action = vendorPk ? 'Update' : 'Create'

    const [name, setName] = useState('')
    const [shortName, setShortName] = useState('')
    const [approvalRegex, setApprovalRegex] = useState('')
    const [priority, setPriority] = useState('5')
    const [autoApprove, setAutoApprove] = useState(false)
    const [approvalMethod, setApprovalMethod] = useState('')
    const [pocList, setPocList] = useState <Array<Stakeholder & { uuid?: string }>>([])

    const classes = useStyles()

    const addPoc = () => {
        setPocList(prev => [{
            name: '',
            phone: '',
            email: '',
            uuid: uuid.v4()
        }, ...prev])
    }
    const existing = useApiData(
        async () => {
            if (vendorPk) {
                const v = await loadVendor(vendorPk)
                setName(v.name || '')
                setShortName(v.shortName || '')
                setAutoApprove(v.autoApprove)
                setPriority(v.priority.toString())
                setPocList((v.pocs || []).map(p => ({ ...p, uuid: uuid.v4() })))
                return v
            } else {
                addPoc()
                return {}
            }
        }, [vendorPk])

    const loadPocOptions = async (value: string) => {
        const stakeholders = await loadStakeholders({
            page: 0,
            pageSize: 10,
            sort: [{
                columnName: 'name',
                direction: 'asc'
            }],
            debouncedFilter: [{
                columnName: 'name',
                value
            }]
        })
        return stakeholders.results.filter(s => pocList.every(p => s.pk !== p.pk))
    }

    const removePoc = (index: number) => {
        const newList = [...pocList.slice(0, index), ...pocList.slice(index + 1)]
        setPocList(newList)
    }

    const setPoc = (index: number, pocs: Stakeholder) => {
        const newList = [...pocList]
        newList[index] = pocs
        setPocList(newList)
    }

    const form = useApi(async () => onSubmit({
        pk: vendorPk,
        name,
        shortName,
        autoApprove,
        approvalRegex,
        priority: parseInt(priority),
        pocs: pocList.map(({ uuid, ...p }) => p)
    }), [onSubmit, vendorPk, name, shortName, autoApprove, approvalRegex, priority, pocList])

    const onApproveToggle = (e: React.ChangeEvent<{}>, toggle: boolean) => {
        if (!toggle) { // Deselect
            setApprovalMethod('')
        } else { // Select
            setApprovalMethod('all')
        }
        setAutoApprove(toggle)
    }

    const onRadioChange = (e: React.ChangeEvent<{}>, val: string) => {
        setApprovalMethod(val)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        form.submit()
    }

    const isEditing = (): boolean => {
        if (existing.loading || form.loading) {
            return false
        }

        if (vendorPk) {
            const v = existing.data! as Vendor
            const vp = (existing.data! as Vendor).pocs
            return name !== v.name ||
                shortName !== v.shortName ||
                autoApprove !== v.autoApprove ||
                pocList.some((p, i) => p.name !== vp[i].name || p.email !== vp[i].email || p.phone !== vp[i].phone)
        } else {
            return Boolean(name || shortName || autoApprove || pocList.some(p => p.name || p.email || p.phone))
        }
    }

    return (
        <form className={ classes.form } onSubmit={ handleSubmit }>
            <Container>
                <Paper className={ classes.paper }>
                    <Typography variant="h5" color="textPrimary" align="center">{ title }</Typography>
                    <Async state={ existing } errorMessage="Failed to load vendor">
                        { () => (
                            <Grid container spacing={ 3 }>
                                <Grid item xs={ 6 }>
                                    <Typography className={ classes.title } variant="h6">
                                        Vendor Details
                                    </Typography>
                                    <TextField
                                        id="name"
                                        required
                                        autoFocus
                                        fullWidth
                                        margin="normal"
                                        label="Vendor name"
                                        value={ name }
                                        onChange={ e => setName(e.currentTarget.value) }/>
                                    <ValidatedTextField
                                        id="short"
                                        required
                                        fullWidth
                                        disabled={ !!vendorPk }
                                        margin="normal"
                                        validator={ value => s3NameRegex.test(value) }
                                        errorMessage="Short name must only include letters, numbers or the following characters ()-!_.*'"
                                        label={ `Short name ${vendorPk ? 'cannot be changed' : '(for URL generation)'}` }
                                        value={ shortName }
                                        onChange={ e => setShortName(e.currentTarget.value) }/>
                                    <ValidatedTextField
                                        id="priority"
                                        type="number"
                                        required
                                        fullWidth
                                        margin="normal"
                                        validator={ isValidPriority }
                                        label="Vendor priority"
                                        errorMessage="Must be 0-10"
                                        value={ priority }
                                        onChange={ e => setPriority(e.currentTarget.value) }/>
                                    <FormControlLabel
                                        control={ <Checkbox
                                            id="approve"
                                            checked={ autoApprove }
                                            onChange={ onApproveToggle }/> }
                                        label="Enable vendor automatic approval"/>
                                    <RadioGroup
                                        className={ classes.group }
                                        value={ approvalMethod }
                                        onChange={ onRadioChange }>
                                        <FormControlLabel value="all" disabled={ !autoApprove } control={ <Radio/> } label="Approve all files"/>
                                        <FormControlLabel value="regex" disabled={ !autoApprove } control={ <Radio/> } label={
                                            <ValidatedTextField
                                                id="regex"
                                                fullWidth
                                                margin="normal"
                                                disabled={ !autoApprove }
                                                InputLabelProps={ { shrink: true } }
                                                validator={ isValidRegex }
                                                errorMessage="Must be valid regular expression."
                                                label="Regular expression"
                                                value={ approvalRegex }
                                                onChange={ e => setApprovalRegex(e.currentTarget.value)
                                                }/>
                                        }/>
                                    </RadioGroup>
                                </Grid>
                                <Grid item xs={ 6 }>
                                    <div className={ classes.title }>
                                        <Typography variant="h6">
                                            Point(s) of contact
                                        </Typography>
                                        <IconButton size="small" onClick={ addPoc }><Add/></IconButton>
                                    </div>
                                    { pocList.map((poc, i) => (
                                        <PointOfContact key={ poc.uuid }
                                            poc={ poc }
                                            setPoc={ poc => setPoc(i, poc) }
                                            removePoc={ () => removePoc(i) }
                                            loadPocOptions={ loadPocOptions }/>
                                    )) }
                                </Grid>
                                <ErrorSnackBar
                                    open={ !!form.error }
                                    clearError={ form.clearError }
                                    message={ `Failed to ${action.toLowerCase()} vendor.` }/>
                                <LoadingButton
                                    loading={ existing.loading || form.loading }
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    className={ classes.submit }>
                                    { action }
                                </LoadingButton>
                                <Prompt
                                    when={ isEditing() }
                                    message="Are you sure you want to leave without saving?"/>
                            </Grid>
                        ) }
                    </Async>
                </Paper>
            </Container>
        </form>
    )
}

export default VendorForm
