import React from 'react'
import { cleanup, fireEvent, render, wait, waitForElement } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ConfirmPopper from './ConfirmPopper'
import { ThumbDown } from '@material-ui/icons'

afterEach(cleanup)

describe('Confirm Popper', () => {

    it('Opens the form when clicked', async () => {
        const submit = jest.fn()
        const { queryByText, getByTitle, container } = render(
            <ConfirmPopper title="asdf" submit={ submit } icon={ <ThumbDown/> } prompt="Want to add a message?"/>
        )
        expect(queryByText('Want to add a message?')).toBeFalsy()
        fireEvent.click(getByTitle('asdf'))
        await waitForElement(() => getByTitle('Submit'), { container })
        expect(queryByText('Want to add a message?')).toBeTruthy()
    })

    it('Submits when clicked', async () => {
        const submit = jest.fn()

        const { getByTitle, getByRole } = render(
            <ConfirmPopper title="asdf" submit={ submit } icon={ <ThumbDown/> } prompt="Want to add a message?"/>
        )

        fireEvent.click(getByTitle('asdf'))
        wait()

        await userEvent.type(getByRole('textbox'), 'Text')
        fireEvent.click(getByRole('submit'))

        expect(submit).toHaveBeenCalledWith('Text')
    })

    it('Conditionally renders', async () => {
        const submit = jest.fn()

        const { queryByTitle } = render(
            <ConfirmPopper title="asdf" submit={ submit } icon={ <ThumbDown/> } prompt="Want to add a message?" invisible/>
        )

        expect(queryByTitle('asdf')).toBeFalsy()
    })

    it('Conditionally renders', async () => {
        const submit = jest.fn()

        const { queryByText, getByTitle } = render(
            <ConfirmPopper title="asdf" submit={ submit } icon={ <ThumbDown/> } prompt="Want to add a message?" preventConfirm/>
        )

        expect(queryByText('Want to add a message?')).toBeFalsy()
        fireEvent.click(getByTitle('asdf'))
        wait()
        expect(queryByText('Want to add a message?')).toBeFalsy()

        expect(submit).toHaveBeenCalledWith('')
    })
})
