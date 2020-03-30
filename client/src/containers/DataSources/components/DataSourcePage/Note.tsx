import React, { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'

import { IconButton, Paper, TextField, Typography } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'
import { Delete } from '@material-ui/icons'

import Date from 'Components/Date'
import { Note as PjNote } from 'Types'
import { deleteNote, editNote } from 'Api'

interface NoteProps {
    note: PjNote
    onNotesChange: () => void
}

const useStyles = makeStyles((theme: Theme) => ({
    noteTitle: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    note: {
        marginTop: theme.spacing(1),
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(2, 3, 3)
    }
}))

const Note = ({ note, onNotesChange }: NoteProps) => {
    const [text, setText] = useState(note.note)
    const [debouncedText] = useDebounce(text, 500)
    const initialRender = useRef(true)

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false
        } else {
            editNote({
                ...note,
                note: debouncedText
            })
        }
    }, [debouncedText, note])
    const classes = useStyles()

    const handleDeleteNote = async (note: PjNote) => {
        if (note.pk) {
            await deleteNote(note)
        }
        onNotesChange()
    }

    return (
        <Paper className={ classes.note }>
            <div className={ classes.noteTitle }>
                <div>
                    <Typography variant="subtitle1" component="span">{ note.createdBy.username } - </Typography>
                    <Typography variant="subtitle2" component="span"><Date date={ note.createdAt }/></Typography>
                </div>
                <IconButton color="inherit" onClick={ () => handleDeleteNote(note) } size="small">
                    <Delete/>
                </IconButton>
            </div>
            <TextField
                multiline
                rowsMax={ 10 }
                placeholder="Enter your note here"
                value={ text }
                onChange={ e => setText(e.currentTarget.value) }/>
        </Paper>
    )
}

export default Note
