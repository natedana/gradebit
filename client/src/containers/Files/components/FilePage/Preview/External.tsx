import React from 'react'

import { Button, Grid } from '@material-ui/core'

import { getFileDataUrl } from 'Api'

import { File } from 'Types'

interface ExternalProps {
    file: File
}

const External = ({ file }: ExternalProps) => {
    return (
        <Grid container justify="center">
            <Button href={ getFileDataUrl(file.pk) } target="_blank" rel="noreferrer" variant="contained">View File</Button>
        </Grid>
    )
}

export default External
