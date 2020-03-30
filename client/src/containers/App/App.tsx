import React, { useState } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import useReactRouter from 'use-react-router'
import classNames from 'classnames'

import { CssBaseline } from '@material-ui/core'
import { createMuiTheme, makeStyles, Theme } from '@material-ui/core/styles'
import { ThemeProvider } from '@material-ui/styles'

import Vendors from 'Containers/Vendors'
import Files from 'Containers/Files'
import DataSources from 'Containers/DataSources'
import Upload from 'Containers/Upload'
import Todos from 'Containers/Todos'

import ProtectedRoute from 'Components/ProtectedRoute'

import Login from './components/Login'
import NavBar from './components/NavBar'
import SidePanel from './components/SidePanel'

import { sidePanelWidth } from 'Constants'
import { UserContext } from 'Contexts'
import { useApi, useApiData } from 'Util'
import { loadUser, signIn, signOut } from 'Api'

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#3b717e'
        },
        secondary: {
            main: '#44565a'
        },
        type: 'dark'
    }
})

const useStyles = makeStyles((theme: Theme) => ({
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        marginLeft: 0
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginLeft: sidePanelWidth
    }
}))

const App = () => {
    const { history } = useReactRouter()
    const [sidePanelOpen, setSidePanelOpen] = useState(false)

    const user = useApiData(loadUser, [], { unauthorizedReload: false })

    const classes = useStyles()

    const login = useApi(async (username: string, password: string) => {
        try {
            if (await signIn(username, password)) {
                await user.reload()
                history.push('/')
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw Error('Username or password did not match our records')
            } else if (error.response.data.detail && error.response.status === 403) {
                throw Error('Account locked due to too many login attempts. Please try again later.')
            } else {
                throw Error('Failed to sign in')
            }
        }
    }, [history, user])

    const handleSignOut = async () => {
        try {
            await signOut()
            await user.reload()
            user.clearData()
            history.push('/')
        } catch (e) {
            return
        }
    }

    const isStaff = user.data && user.data.isStaff
    const vendorsEnabled = isStaff && user.data!.permissions.includes('add_vendor')
    const filesEnabled = isStaff && user.data!.permissions.includes('add_file')
    const dataTrackerEnabled = isStaff && user.data!.permissions.includes('add_datasource')

    return (
        <ThemeProvider theme={ theme }>
            <UserContext.Provider value={ user.data }>
                <CssBaseline/>
                <NavBar
                    user={ user }
                    sidePanelOpen={ sidePanelOpen }
                    onSidePanelOpen={ () => setSidePanelOpen(true) }
                    onSignOut={ handleSignOut }/>
                <SidePanel user={ user.data } open={ sidePanelOpen } onClose={ () => setSidePanelOpen(false) }/>
                <div className={ classNames(classes.content, { [classes.contentShift]: sidePanelOpen }) }>
                    <Switch>
                        <Route exact path="/" component={ Upload }/>
                        <ProtectedRoute enabled={ !user.data } path="/login" render={ () => (
                            <Login onSignIn={ login.submit } error={ login.error } loading={ login.loading }/>
                        ) }/>
                        <ProtectedRoute enabled={ vendorsEnabled } loading={ user.loading } path="/vendors" component={ Vendors }/>
                        <ProtectedRoute enabled={ filesEnabled } loading={ user.loading } path="/files" component={ Files }/>
                        <ProtectedRoute enabled={ dataTrackerEnabled } path="/datasources" component={ DataSources }/>
                        <ProtectedRoute enabled={ dataTrackerEnabled } path="/todos" component={ Todos }/>
                        { /* Only redirect once the user has been loaded */ }
                        { !user.loading && <Redirect to="/"/> }
                    </Switch>
                </div>
            </UserContext.Provider>
        </ThemeProvider>
    )
}

export default App
