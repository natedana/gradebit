import React from 'react'

import { AppBar, Toolbar, Typography } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'

interface PageHeaderProps {
    title?: string
    children?: React.ReactNode
}

const useStyles = makeStyles((theme: Theme) => ({
    headerBar: {
        margin: theme.spacing(-3, -3, 3, -3)
    }
}))

const PageHeader = ({ title, children }: PageHeaderProps) => {
    const classes = useStyles()

    return (
        <div className={ classes.headerBar }>
            <AppBar position="static" color="default">
                <Toolbar>
                    { title && <Typography variant="h6">{ title }</Typography> }
                    { children }
                </Toolbar>
            </AppBar>
        </div>
    )
}

export default PageHeader
