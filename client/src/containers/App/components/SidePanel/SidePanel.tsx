import React from 'react'
import { Link } from 'react-router-dom'
import useRouter from 'use-react-router'

import { Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Tooltip, Typography } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'
import { CheckBox, ChevronLeft, CloudUpload, Description, FileCopy, People } from '@material-ui/icons'

import { sidePanelWidth } from 'Constants'
import { usePermission } from 'Util'
import { User } from 'Types'

interface SidePanelProps {
    user?: User
    open: boolean
    onClose: () => void
}

const useStyles = makeStyles((theme: Theme) => ({
    menuButton: {
        marginRight: theme.spacing(2)
    },
    drawerPaper: {
        width: sidePanelWidth
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        ...theme.mixins.toolbar,
        justifyContent: 'space-between'
    }
}))

const SidePanel = ({ user, open, onClose }: SidePanelProps) => {
    const classes = useStyles()
    const { location } = useRouter()
    const vendorsEnabled = usePermission('add_vendor')
    const filesEnabled = usePermission('add_file')
    const dataTrackerEnabled = usePermission('add_datasource')

    const links = [
        {
            path: '/',
            icon: <CloudUpload/>,
            text: 'Upload',
            admin: true,
            visible: true
        },
        {
            path: '/vendors',
            icon: <People/>,
            text: 'Vendors',
            admin: true,
            visible: vendorsEnabled
        },
        {
            path: '/files',
            icon: <Description/>,
            text: 'Files',
            admin: true,
            visible: filesEnabled
        },
        {
            path: '/datasources',
            icon: <FileCopy/>,
            text: 'Data Sources',
            admin: true,
            visible: dataTrackerEnabled
        },
        {
            path: '/todos',
            icon: <CheckBox/>,
            text: 'Todos',
            admin: true,
            visible: dataTrackerEnabled
        }
    ]

    return (
        <Drawer
            variant="persistent"
            anchor="left"
            open={ open }
            classes={ {
                paper: classes.drawerPaper
            } }>
            <div className={ classes.drawerHeader }>
                <Typography variant="h6">{ user && user.username }</Typography>
                <Tooltip title="Close menu">
                    <IconButton onClick={ onClose }>
                        <ChevronLeft/>
                    </IconButton>
                </Tooltip>
            </div>
            <Divider/>
            <List>
                { links
                    .filter(link => link.visible && (!link.admin || (user && user.isStaff)))
                    .map(link => (
                        <ListItem button
                            component={ Link }
                            key={ link.path }
                            selected={ location.pathname === link.path }
                            to={ link.path }>
                            <ListItemIcon>{ link.icon }</ListItemIcon>
                            <ListItemText primary={ link.text }/>
                        </ListItem>
                    )) }
            </List>
        </Drawer>
    )
}

export default SidePanel
