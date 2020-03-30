import React from 'react'

import { IconButton, Typography } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'
import { Add } from '@material-ui/icons'

import Async from 'Components/Async'

import { useApiData } from 'Util'
import { createNote, loadNotes } from 'Api'

import Note from './Note'

interface NotesProps {
    dataSourcePk: string
}

const useStyles = makeStyles((theme: Theme) => ({
    title: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
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

const Notes = ({ dataSourcePk }: NotesProps) => {
    const classes = useStyles()
    const notes = useApiData(() => loadNotes(dataSourcePk), [dataSourcePk])

    const handleAddNote = async () => {
        await createNote({}, dataSourcePk)
        notes.reload()
    }

    return (
        <Async state={ notes } errorMessage="Failed to load notes">
            { () =>
                <>
                    <div className={ classes.title }>
                        <Typography variant="h5">Notes:</Typography>
                        <IconButton color="inherit" onClick={ handleAddNote }>
                            <Add/>
                        </IconButton>
                    </div>
                    { notes.data && notes.data.map((note, i) => <Note note={ note } key={ i } onNotesChange={ notes.reload }/>) }
                </>
            }
        </Async>
    )
}

export default Notes
