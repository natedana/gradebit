import React from 'react'
import { cleanup, render, waitForElement } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { getInputByLabel } from 'TestUtil'

import ValidatedTextField from './ValidatedTextField'

afterEach(cleanup)

it('Displays regex errors', async () => {
    const { container, queryByText, getByText } = render(
        <ValidatedTextField
            id="phone"
            label="Phone number"
            errorMessage="Error"
            regex={ /^\d*$/ }/>
    )

    expect(queryByText('Error')).toBeFalsy()

    userEvent.type(getInputByLabel(container, 'Phone number'), 'Text')
    await waitForElement(() => getByText('Error'), { container })
})

it('Displays validator errors', async () => {
    const { container, queryByText, getByText } = render(
        <ValidatedTextField
            id="phone"
            label="Phone number"
            errorMessage="Error"
            validator={ value => /^\d*$/.test(value) }/>
    )

    expect(queryByText('Error')).toBeFalsy()

    userEvent.type(getInputByLabel(container, 'Phone number'), 'Text')
    await waitForElement(() => getByText('Error'), { container })
})
