import React from 'react'
import { cleanup, render } from '@testing-library/react'

import LoadingIndicator from './LoadingIndicator'

afterEach(cleanup)

it('Displays loading text', () => {
    const { queryByText, queryByRole, rerender } = render(
        <LoadingIndicator text="Loading"/>
    )

    expect(queryByText('Loading')).toBeTruthy()
    expect(queryByRole('progressbar')).toBeTruthy()

    rerender(<LoadingIndicator/>)

    expect(queryByText('Loading')).toBeFalsy()
    expect(queryByRole('progressbar')).toBeTruthy()
})
