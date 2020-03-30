import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { makeStyles } from '@material-ui/core/styles'
import { Avatar, Chip, FormLabel, Typography } from '@material-ui/core'
import { Attachment } from '@material-ui/icons'

const useStyles = makeStyles(theme => ({
    container: {
        width: 'auto',
        height: 'auto',
        display: 'block',
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1)
    },
    dropzone: {
        backgroundColor: theme.palette.grey[300],
        height: '200px',
        cursor: 'pointer',
        borderStyle: 'dashed',
        borderWidth: '2px',
        borderRadius: 4,
        borderColor: theme.palette.grey[900],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
            'background-color': theme.palette.grey[500]
        }
    },
    dropzoneText: {
        color: theme.palette.getContrastText(theme.palette.grey[300]),
        margin: theme.spacing(0, 1)
    },
    fileList: {
        marginTop: theme.spacing(1),
        width: 'auto',
        display: 'flex',
        flexWrap: 'wrap'
    },
    fileItem: {
        margin: '1px'
    }
}))

interface DropzoneProps {
    files: File[]
    onAdd: (newFiles: File[]) => void
    onDelete: (index: number) => void
}

const Dropzone = ({ files, onAdd, onDelete }: DropzoneProps) => {

    const onDrop = useCallback((acceptedFiles: File[]) => {
        onAdd(acceptedFiles)
    }, [onAdd])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    const classes = useStyles()

    const avatar =
        <Avatar>
            <Attachment/>
        </Avatar>

    const dragText = isDragActive ? 'Drop the files here ...' : 'Drag and drop some files here, or click to select files'

    const chips = files.map((f, i) =>
        <Chip key={ i } label={ f.name } avatar={ avatar } className={ classes.fileItem } onDelete={ () => onDelete(i) }/>
    )

    return (
        <div className={ classes.container }>
            <FormLabel htmlFor="files">
                Files
            </FormLabel>
            <div { ...getRootProps() } className={ classes.dropzone }>
                <input { ...getInputProps() } id="files"/>
                <Typography color="textPrimary" align="center" variant="caption" className={ classes.dropzoneText }>
                    { dragText }
                </Typography>
            </div>
            <div className={ classes.fileList }>{ chips }</div>
        </div>
    )
}

export default Dropzone
