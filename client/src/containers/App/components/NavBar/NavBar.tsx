import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { AppBar, Button, CircularProgress, IconButton, Menu, MenuItem, Theme, Toolbar, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { AccountCircle, Menu as MenuIcon } from '@material-ui/icons'

import { sidePanelWidth } from 'Constants'

import { AsyncData, User } from 'Types'

import brandImage from 'Images/drop_icon.png'

interface NavBarProps {
    user: AsyncData<User>
    sidePanelOpen: boolean
    onSidePanelOpen: () => void
    onSignOut: () => void
}

const useStyles = makeStyles((theme: Theme) => ({
    grow: {
        flexGrow: 1
    },
    menuButton: {
        marginRight: theme.spacing(2),
        width: '48px',
        transition: 'width 200ms, padding 200ms',
        overflow: 'hidden'
    },
    collapse: {
        width: 0,
        padding: 0
    },
    navBar: {
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        })
    },
    navBarShift: {
        width: `calc(100% - ${sidePanelWidth}px)`,
        marginLeft: sidePanelWidth,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    link: {
        color: theme.palette.text.primary,
        textDecoration: 'none',
        '&hover': {
            textDecoration: 'none'
        }
    }
}))

const NavBar = ({ user, sidePanelOpen, onSidePanelOpen, onSignOut }: NavBarProps) => {
    const classes = useStyles()

    const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()

    const handleProfile = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(undefined)
    }

    const handleSignOut = () => {
        handleClose()
        onSignOut()
    }

    const menu = user.data && user.data.isStaff && (
        <Tooltip title="Open menu">
            <IconButton
                color="inherit"
                onClick={ onSidePanelOpen }
                edge="start"
                className={ classNames(classes.menuButton, sidePanelOpen && classes.collapse) }>
                <MenuIcon/>
            </IconButton>
        </Tooltip>
    )

    let profile
    if (user.loading) {
        profile = <CircularProgress size={ 24 } color="inherit"/>
    } else if (user.data) {
        profile = (
            <>
                <Tooltip title={ user.data.username } placement="left">
                    <IconButton color="inherit" onClick={ handleProfile }>
                        <AccountCircle/>
                    </IconButton>
                </Tooltip>
                <Menu
                    id="menu-account"
                    anchorEl={ anchorEl }
                    getContentAnchorEl={ null }
                    anchorOrigin={ {
                        vertical: 'bottom',
                        horizontal: 'right'
                    } }
                    open={ !!anchorEl }
                    onClose={ handleClose }>
                    { user.data.isStaff && <MenuItem><Link to="/admin/" target="_blank" className={ classes.link }>Administration</Link></MenuItem> }
                    <MenuItem onClick={ handleSignOut }>Sign out</MenuItem>
                </Menu>
            </>
        )
    } else {
        profile = <Button component={ Link } color="inherit" to="/login">Sign In</Button>
    }

    return (
        <AppBar className={ classNames(classes.navBar, { [classes.navBarShift]: sidePanelOpen }) } position="static">
            <Toolbar>
                { menu }
                <Link to="/">
                    <img src={ brandImage } height={ 40 }/>
                </Link>
                <div className={ classes.grow }/>
                { profile }
            </Toolbar>
        </AppBar>
    )
}

export default NavBar
