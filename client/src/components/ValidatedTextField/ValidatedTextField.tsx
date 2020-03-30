import React, { useState } from 'react'

import TextField, { TextFieldProps } from '@material-ui/core/TextField'

interface ValidatedTextFieldProps {
    errorMessage: string
    regex?: RegExp
    validator?: (value: string) => boolean
}

type CombinedProps = ValidatedTextFieldProps & TextFieldProps

const ValidatedTextField = ({ errorMessage, regex, validator, onChange, ...props }: CombinedProps) => {
    const [error, setError] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.currentTarget
        let err = false
        if (value) {
            if (regex && !regex.test(value)) {
                err = true
            } else if (validator && !validator(value)) {
                err = true
            }
        }
        setError(err)
        if (onChange) {
            onChange(e)
        }
    }

    return (
        <TextField
            { ...props }
            error={ error }
            helperText={ error && errorMessage }
            onChange={ handleChange }/>
    )
}

export default ValidatedTextField
