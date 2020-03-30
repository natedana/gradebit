import React from 'react'

import { IconButton, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Add } from '@material-ui/icons'

import PageHeader from 'Components/PageHeader'
import Async from 'Components/Async'

import { useApiData } from 'Util'
import { createTodo, deleteTodo, editTodo, loadTodos } from 'Api'
import { Todo as TodoType } from 'Types'

import Todo from './Todo'

const useStyles = makeStyles({
    grow: {
        flexGrow: 1
    }
})

const TodoList = () => {
    const classes = useStyles()

    const todos = useApiData(loadTodos)

    const handleCreateTodo = async () => {
        await createTodo()
        todos.reload()
    }

    const handleDeleteTodo = async (todo: TodoType) => {
        await deleteTodo(todo)
        todos.reload()
    }

    return (
        <>
            <PageHeader title={ `Todos (${todos.data ? todos.data.length : 0})` }>
                <div className={ classes.grow }/>
                <Tooltip title="Add Todo">
                    <IconButton onClick={ handleCreateTodo }>
                        <Add/>
                    </IconButton>
                </Tooltip>
            </PageHeader>
            <Async state={ todos } errorMessage="Failed to load todos">
                { data =>
                    <div>{ data.map((t, i) =>
                        <Todo todo={ t } key={ i } onEdit={ editTodo } onDelete={ handleDeleteTodo }/>
                    ) }
                    </div>
                }
            </Async>
        </>
    )
}

export default TodoList
