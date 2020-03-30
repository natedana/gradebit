import React from 'react'
import { cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import LoadingButton from './LoadingButton'

afterEach(cleanup)

it('Button is disabled when loading and enabled when not', () => {
    const { getByText, queryByRole, rerender } = render(
        <LoadingButton loading={ false }>Submit</LoadingButton>
    )

    const button = getByText('Submit')

    expect(button).toBeEnabled()
    expect(queryByRole('progressbar')).toBeFalsy()

    rerender(<LoadingButton loading>Submit</LoadingButton>)

    expect(button).toBeDisabled()
    expect(queryByRole('progressbar')).toBeTruthy()
})
