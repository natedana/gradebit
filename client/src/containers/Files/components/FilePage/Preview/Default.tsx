import React, { useState } from 'react'

import { Button, Grid, Paper } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'

import { loadFileContent } from 'Api'
import { useApiData } from 'Util'

import { File } from 'Types'

interface DefaultProps {
    file: File
    maxSize?: number
}

const useStyles = makeStyles((theme: Theme) => ({
    paper: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        whiteSpace: 'pre-wrap'
    }
}))

const Default = ({ file, maxSize = 1024 * 10 }: DefaultProps) => {
    const [displayLength, setDisplayLength] = useState(maxSize)
    const content = useApiData(() => loadFileContent(file.pk), [file.pk])
    const classes = useStyles()

    const data = content.data && Buffer.from(content.data).toString('utf8')

    return (
        <Paper className={ classes.paper }>
            { data && data.slice(0, displayLength) }
            { data && data.length > displayLength &&
                <Grid container justify="center">
                    <Button
                        onClick={ () => setDisplayLength(prev => prev + maxSize) }>
                        Show more
                    </Button>
                </Grid>
            }
        </Paper>
    )
}

export default Default
