import React, { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'

import { Card, CardContent, CardHeader, Checkbox, IconButton, InputBase, TextField } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Delete } from '@material-ui/icons'

import Date from 'Components/Date'
import { Todo as TodoType } from 'Types'

interface TodoProps {
    todo: TodoType
    onEdit: (todo: TodoType) => void
    onDelete: (todo: TodoType) => void
}

const useStyles = makeStyles({
    card: {
        minWidth: 275,
        marginBottom: 15
    }
})

const Todo = ({ todo, onEdit, onDelete }: TodoProps) => {
    const classes = useStyles()

    const [complete, setComplete] = useState(todo.complete)
    const [lead, setLead] = useState(todo.lead)
    const [text, setText] = useState(todo.text)
    const [debouncedLead] = useDebounce(lead, 500)
    const [debouncedText] = useDebounce(text, 500)

    useEffect(() => {
        if (todo.lead !== debouncedLead || todo.text !== debouncedText || todo.complete !== complete) {
            onEdit({
                ...todo,
                lead: debouncedLead,
                text: debouncedText,
                complete
            })
        }
    }, [todo, debouncedLead, debouncedText, complete, onEdit])

    const handleDelete = () => {
        const r = confirm('Are you sure you want to delete this Todo?')
        if (r === true) {
            onDelete(todo)
        }
    }

    return (
        <Card className={ classes.card }>
            <CardHeader
                avatar={
                    <Checkbox
                        checked={ complete }
                        onChange={ (_, c) => setComplete(c) }/>
                }
                title={
                    <InputBase
                        fullWidth
                        value={ lead }
                        placeholder="Todo title"
                        onChange={ e => setLead(e.target.value) }/>
                }
                subheader={ <Date date={ todo.createdAt }/> }
                action={ <IconButton onClick={ handleDelete }><Delete/></IconButton> }/>
            <CardContent>
                <TextField
                    fullWidth
                    value={ text }
                    placeholder="Enter your Todo description here"
                    rowsMax={ 4 }
                    onChange={ e => setText(e.target.value) }/>
            </CardContent>
        </Card>
    )
}

export default Todo
