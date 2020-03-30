import React from 'react'
import { isEmail } from 'validator'

import { Avatar, Button, ExpansionPanel, ExpansionPanelActions, ExpansionPanelDetails, ExpansionPanelSummary, ListItemText, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { ExpandMore, Person } from '@material-ui/icons'

import ValidatedTextField from 'Components/ValidatedTextField'
import CreatableSelect from 'Components/CreatableSelect'

import { Stakeholder } from 'Types'

interface PointOfContactProps {
    poc: Stakeholder
    setPoc: (pocs: Stakeholder) => void
    removePoc: () => void
    loadPocOptions: (value: string) => Promise<Stakeholder[]>
}

const useStyles = makeStyles(theme => ({
    root: {
        backgroundColor: theme.palette.secondary.main
    },
    title: {
        display: 'flex',
        alignItems: 'center'
    },
    titleText: {
        marginLeft: theme.spacing(2)
    },
    expansionDetails: {
        flexDirection: 'column'
    }
}))

const PointOfContact = ({ poc, setPoc, removePoc, loadPocOptions }: PointOfContactProps) => {
    const classes = useStyles()

    const setPocValue = (key: keyof Stakeholder, value: string) => {
        setPoc({
            ...poc,
            pk: undefined,
            [key]: value
        })
    }

    const isValid = poc.name.length > 0 && (!poc.email || isEmail(poc.email)) && /^[0-9]*$/.test(poc.phone)

    const color = !isEmail(poc.email) && !/^[0-9]*$/.test(poc.phone) ? 'error' : 'initial'

    return (
        <ExpansionPanel defaultExpanded={ !poc.pk } className={ classes.root } disabled={ !isValid }>
            <ExpansionPanelSummary expandIcon={ <ExpandMore/> }>
                <div className={ classes.title }>
                    <Avatar>
                        <Person/>
                    </Avatar>
                    <Typography className={ classes.titleText } color={ color }>
                        { poc.name || 'New contact' }
                    </Typography>
                </div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={ classes.expansionDetails }>
                <CreatableSelect
                    id="poc-name"
                    required
                    fullWidth
                    margin="dense"
                    label="Name"
                    value={ poc.name }
                    onChange={ value => setPocValue('name', value) }
                    getSuggestions={ loadPocOptions }
                    getSuggestionValue={ s => s.name }
                    renderSuggestion={ s => <ListItemText primary={ s.name } secondary={ `${s.email} ${s.phone}` }/> }
                    onSuggestionSelected={ (e, { suggestion }) => setPoc({ ...poc, ...suggestion }) }
                    shouldRenderSuggestions={ () => !poc.pk }/>
                <ValidatedTextField
                    id="poc-email"
                    fullWidth
                    margin="dense"
                    label="Email"
                    value={ poc.email }
                    validator={ isEmail }
                    errorMessage="Invalid email"
                    onChange={ e => setPocValue('email', e.currentTarget.value) }/>
                <ValidatedTextField
                    id="poc-phone"
                    fullWidth
                    margin="dense"
                    label="Phone"
                    value={ poc.phone }
                    regex={ /^[0-9]*$/ }
                    errorMessage="Only include numbers"
                    onChange={ e => setPocValue('phone', e.currentTarget.value) }/>
            </ExpansionPanelDetails>
            <ExpansionPanelActions>
                <Button size="small" onClick={ removePoc }>Delete</Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    )
}

export default PointOfContact
