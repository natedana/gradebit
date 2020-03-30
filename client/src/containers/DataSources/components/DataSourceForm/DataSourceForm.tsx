import React, { useState } from 'react'
import { Prompt, RouteComponentProps } from 'react-router'
import { snakeCase, titleCase } from 'change-case'

import { Container, Grid, ListItemText, Paper, Snackbar, SnackbarContent, TextField, Typography } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'

import LoadingButton from 'Components/LoadingButton'
import Async from 'Components/Async'
import CreatableSelect from 'Components/CreatableSelect'

import { useApi, useApiData } from 'Util'
import { loadDataSource, loadSuggestions } from 'Api'
import { DataSource } from 'Types'

interface DataSourceFormProps extends RouteComponentProps<{ dataSourcePk: string }> {
    onSubmit: (ds: DataSource) => void
}

type TextFieldData = [keyof DataSource, string | number, (v: string | number) => void, boolean, string?]
type SelectFieldData = [keyof DataSource, string, (v: string | number) => void, boolean]

const useStyles = makeStyles((theme: Theme) => ({
    paper: {
        padding: theme.spacing(2, 3, 3)
    },
    form: {
        width: '100%'
    },
    submit: {
        marginTop: theme.spacing(3),
        marginLeft: 'auto'
    },
    snackbar: {
        backgroundColor: theme.palette.error.main
    }
}))

const DataSourceForm = ({ onSubmit, match }: DataSourceFormProps) => {
    const dataSourcePk = match && match.params && match.params.dataSourcePk
    const title = (dataSourcePk ? 'Edit' : 'New') + ' Data Source'
    const action = dataSourcePk ? 'Update' : 'Create'

    const [dataOrigin, setDataOrigin] = useState('')
    const [dataType, setDataType] = useState('')
    const [dateInformation, setDateInformation] = useState('')
    const [dateIngest, setDateIngest] = useState('')
    const [entities, setEntities] = useState('')
    const [frequency, setFrequency] = useState('')
    const [leads, setLeads] = useState('')
    const [name, setName] = useState('')
    const [portfolio, setPortfolio] = useState('')
    const [priority, setPriority] = useState(0)
    const [requestMethod, setRequestMethod] = useState('')
    const [status, setStatus] = useState('')
    const [theme, setTheme] = useState('')
    const [updatePeriodically, setUpdatePeriodically] = useState('')

    const existing = useApiData(async () => {
        if (dataSourcePk) {
            const d = await loadDataSource(dataSourcePk)
            setDataOrigin(d.dataOrigin || '')
            setDataType(d.dataType || '')
            setDateInformation(d.dateInformation || '')
            setDateIngest(d.dateIngest || '')
            setEntities(d.entities || '')
            setFrequency(d.frequency || '')
            setLeads(d.leads || '')
            setName(d.name || '')
            setPortfolio(d.portfolio || '')
            setPriority(d.priority || 0)
            setRequestMethod(d.requestMethod || '')
            setStatus(d.status || '')
            setTheme(d.theme || '')
            setUpdatePeriodically(d.updatePeriodically || '')
            return d
        } else {
            return {}
        }
    }, [dataSourcePk])

    const classes = useStyles()

    const form = useApi(async () => onSubmit({
        pk: dataSourcePk,
        dataOrigin,
        dataType,
        dateInformation: dateInformation || null,
        dateIngest: dateIngest || null,
        entities,
        frequency,
        leads,
        name,
        portfolio,
        priority,
        requestMethod,
        status,
        theme,
        updatePeriodically
    }),
    [onSubmit, dataSourcePk, dataOrigin, dataType, dateInformation, dateIngest, entities, frequency, leads, name, portfolio, priority, requestMethod, status, theme, updatePeriodically])

    const loadNewSuggestions = async (key: keyof DataSource, value: string) => {
        return await loadSuggestions(snakeCase(key), value)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        form.submit()
    }

    const isEditing = (): boolean => {
        if (existing.loading || form.loading) {
            return false
        }
        if (dataSourcePk) {
            const v = existing.data! as DataSource
            return dataOrigin !== v.dataOrigin ||
                dataType !== v.dataType ||
                dateInformation !== v.dateInformation ||
                dateIngest !== v.dateIngest ||
                entities !== v.entities ||
                frequency !== v.frequency ||
                leads !== v.leads ||
                name !== v.name ||
                portfolio !== v.portfolio ||
                priority !== v.priority ||
                requestMethod !== v.requestMethod ||
                status !== v.status ||
                theme !== v.theme ||
                updatePeriodically !== v.updatePeriodically
        } else {
            return Boolean(dataOrigin || dataType || dateInformation ||
                dateIngest || entities || frequency || leads || name || portfolio ||
                priority || requestMethod || status || theme || updatePeriodically)
        }
    }

    const textField = ([key, value, setter, required, type]: TextFieldData) =>
        <TextField
            key={ key }
            type={ type || 'text' }
            id={ key }
            required={ required }
            fullWidth
            InputLabelProps={ type === 'date' ? { shrink: true } : undefined }
            margin="dense"
            label={ titleCase(key) }
            value={ value }
            onChange={ e => setter(e.currentTarget.value) }/>

    const selectTextField = ([key, value, setter, required]: SelectFieldData) =>
        <CreatableSelect
            key={ key }
            id={ key }
            required={ required }
            fullWidth
            margin="dense"
            label={ titleCase(key) }
            value={ value }
            onChange={ setter }
            getSuggestions={ v => loadNewSuggestions(key, v) }
            getSuggestionValue={ s => s }
            renderSuggestion={ s => <ListItemText primary={ s }/> }
            onSuggestionSelected={ (e, { suggestion }) => setter(suggestion) }
            shouldRenderSuggestions={ () => true }/>

    return (
        <form className={ classes.form } onSubmit={ handleSubmit }>
            <Container>
                <Paper className={ classes.paper }>
                    <Typography variant="h5" color="textPrimary" align="center">{ title }</Typography>
                    <Async state={ existing } errorMessage="Failed to load data source">
                        { () => (
                            <Grid container spacing={ 3 }>
                                <Grid item xs={ 6 }>
                                    { ([
                                        ['name', name, setName, true, 'text'],
                                        ['dataOrigin', dataOrigin, setDataOrigin, true]
                                    ] as TextFieldData[]).map(textField) }
                                    { ([
                                        ['dataType', dataType, setDataType, true],
                                        ['portfolio', portfolio, setPortfolio, false],
                                        ['theme', theme, setTheme, false],
                                        ['status', status, setStatus, true],
                                        ['leads', leads, setLeads, false]
                                    ] as SelectFieldData[]).map(selectTextField) }
                                </Grid>
                                <Grid item xs={ 6 }>
                                    { ([
                                        ['dateInformation', dateInformation, setDateInformation, false, 'date'],
                                        ['dateIngest', dateIngest, setDateIngest, false, 'date'],
                                        ['entities', entities, setEntities, false],
                                        ['priority', priority, setPriority, false, 'number'],
                                        ['frequency', frequency, setFrequency, false],
                                        ['requestMethod', requestMethod, setRequestMethod, false],
                                        ['updatePeriodically', updatePeriodically, setUpdatePeriodically, false]
                                    ] as TextFieldData[]).map(textField) }
                                </Grid>
                                <Snackbar
                                    open={ !!form.error }
                                    autoHideDuration={ 3000 }
                                    onClose={ form.clearError }>
                                    <SnackbarContent
                                        className={ classes.snackbar }
                                        message={ !!form.error && `Failed to ${action.toLowerCase()} data source.` }/>
                                </Snackbar>
                                <LoadingButton
                                    fullWidth
                                    loading={ existing.loading || form.loading }
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    className={ classes.submit }>
                                    { action }
                                </LoadingButton>
                            </Grid>
                        ) }
                    </Async>
                    <Prompt
                        when={ isEditing() }
                        message="Are you sure you want to leave without saving?"/>
                </Paper>
            </Container>
        </form>
    )
}

export default DataSourceForm
