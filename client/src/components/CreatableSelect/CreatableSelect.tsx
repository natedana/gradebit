import React, { useRef, useState } from 'react'
import Autosuggest from 'react-autosuggest'
import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import { useDebouncedCallback } from 'use-debounce'

import { MenuItem, Omit, Paper, Popper, TextField } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { TextFieldProps } from '@material-ui/core/TextField'

interface SuggestionProps<T> {
    value: string
    onChange: (value: string) => void
    suggestionDebounceTime?: number
    getSuggestions: (value: string) => Promise<T[]>
    getSuggestionValue: Autosuggest.GetSuggestionValue<T>
    renderSuggestion?: Autosuggest.RenderSuggestion<T>
    onSuggestionSelected?: Autosuggest.OnSuggestionSelected<T>
    shouldRenderSuggestions?: Autosuggest.ShouldRenderSuggestions
}

type CreatableSelectProps<T> = SuggestionProps<T> & Omit<TextFieldProps, 'value' | 'onChange'>

const useStyles = makeStyles({
    suggestionsList: {
        margin: 0,
        padding: 0,
        listStyleType: 'none'
    },
    container: {
        maxHeight: '300px',
        overflowY: 'auto'
    }
})

const CreatableSelect = <T extends {} = string>({
    value,
    onChange,
    suggestionDebounceTime = 500,
    getSuggestions,
    getSuggestionValue,
    renderSuggestion,
    onSuggestionSelected,
    shouldRenderSuggestions,
    ...textFieldProps
}: CreatableSelectProps<T>) => {
    const anchorEl = useRef<HTMLElement>()
    const [suggestions, setSuggestions] = useState<T[]>([])

    const classes = useStyles()

    const [loadSuggestions] = useDebouncedCallback<Autosuggest.SuggestionsFetchRequested>(async ({ value }) => {
        setSuggestions(await getSuggestions(value))
    }, suggestionDebounceTime)

    const defaultRenderSuggestion: Autosuggest.RenderSuggestion<T> = (suggestion, { query }) => {
        const matches = match(getSuggestionValue(suggestion), query)
        const parts = parse(getSuggestionValue(suggestion), matches)

        return (
            <div>
                { parts.map((part, i) => (
                    <span key={ i } style={ { fontWeight: part.highlight ? 500 : 400 } }>
                        { part.text }
                    </span>
                )) }
            </div>
        )
    }

    const renderInputComponent = (inputProps: Autosuggest.InputProps<T>) => {
        const { inputRef, ref, ...other } = inputProps

        return (
            <TextField
                InputProps={ {
                    autoComplete: 'new-password', // Make browsers ignore for autofill
                    inputRef: node => {
                        ref(node)
                        inputRef(node)
                    }
                } }
                { ...other as any }
                { ...textFieldProps }/>
        )
    }

    return (
        <Autosuggest
            renderInputComponent={ renderInputComponent }
            suggestions={ suggestions }
            onSuggestionsFetchRequested={ loadSuggestions }
            onSuggestionsClearRequested={ () => setSuggestions([]) }
            onSuggestionSelected={ onSuggestionSelected }
            getSuggestionValue={ getSuggestionValue }
            shouldRenderSuggestions={ shouldRenderSuggestions }
            renderSuggestion={ (suggestion, params) => (
                <MenuItem selected={ params.isHighlighted } component="div">
                    { (renderSuggestion || defaultRenderSuggestion)(suggestion, params) }
                </MenuItem>
            ) }
            inputProps={ {
                inputRef: (node: HTMLInputElement) => {
                    anchorEl.current = node
                },
                value,
                onChange: (e, { newValue }) => onChange(newValue)
            } }
            renderSuggestionsContainer={ options => (
                <Popper anchorEl={ anchorEl.current } open={ !!options.children } className={ classes.container }
                    placement="bottom-start"
                    modifiers={ { flip: { enabled: false } } }>
                    <Paper square { ...options.containerProps } style={ {
                        width: anchorEl.current ? anchorEl.current.clientWidth : undefined
                    } }>
                        { options.children }
                    </Paper>
                </Popper>
            ) }
            theme={ {
                suggestionsList: classes.suggestionsList
            } }/>
    )
}

export default CreatableSelect
