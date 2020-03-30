import React from 'react'
import { cleanup, render } from '@testing-library/react'

import Date from './Date'

afterEach(cleanup)

it('Takes an ISO string and returns a readable Date', () => {
    const { queryByText } = render(
        <Date date="2019-04-08T15:20:57.028Z"/>
    )

    expect(queryByText('Mon Apr 08 2019')).toBeTruthy()
})
