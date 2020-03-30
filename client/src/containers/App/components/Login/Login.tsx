import React, { useState } from 'react'

import { Avatar, Paper, TextField, Theme, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { LockOutlined } from '@material-ui/icons'

import LoadingButton from 'Components/LoadingButton'

interface LoginProps {
    loading: boolean
    error?: Error
    onSignIn: (username: string, password: string) => void
}

const useStyles = makeStyles((theme: Theme) => ({
    main: {
        width: 'auto',
        display: 'block',
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        [theme.breakpoints.up(400 + theme.spacing(6))]: {
            width: 400,
            marginLeft: 'auto',
            marginRight: 'auto'
        }
    },
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing(2, 3, 3)
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main
    },
    form: {
        width: '100%',
        marginTop: theme.spacing(1)
    },
    submit: {
        marginTop: theme.spacing(3)
    }
}))

const Login = ({ loading, error, onSignIn }: LoginProps) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSignIn(username, password)
    }

    const classes = useStyles()

    return (
        <div className={ classes.main }>
            <Paper className={ classes.paper }>
                <Avatar className={ classes.avatar }>
                    <LockOutlined/>
                </Avatar>
                <Typography variant="h5" color="textPrimary">Sign in</Typography>
                <form onSubmit={ handleSubmit }>
                    <TextField
                        required
                        fullWidth
                        autoFocus
                        margin="normal"
                        id="username"
                        label="Username"
                        value={ username }
                        onChange={ e => setUsername(e.target.value) }/>
                    <TextField
                        required
                        fullWidth
                        margin="normal"
                        id="password"
                        type="password"
                        label="Password"
                        value={ password }
                        onChange={ e => setPassword(e.target.value) }/>
                    { error &&
                        <Typography color="error">{ error.message }</Typography>
                    }
                    <LoadingButton
                        loading={ loading }
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={ classes.submit }>
                        Sign in
                    </LoadingButton>
                </form>
            </Paper>
        </div>
    )
}

export default Login
