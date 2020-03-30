import React from 'react'
import { cleanup, render } from '@testing-library/react'

import ErrorSnackbar from './ErrorSnackbar'

afterEach(cleanup)

describe('Error Snackbar', () => {

    it('Does not show when no error is present', () => {
        const { queryByText } = render(
            <ErrorSnackbar open={ false } clearError={ () => null } message="ERR"/>
        )

        expect(queryByText('ERR')).toBeFalsy()
    })
    it('Shows when error is present', () => {
        const { queryByText } = render(
            <ErrorSnackbar open clearError={ () => null } message="ERR"/>
        )

        expect(queryByText('ERR')).toBeTruthy()
    })
})
