import React from 'react'
import { cleanup, render } from '@testing-library/react'

import Async from './Async'

import { AsyncData } from 'Types'

afterEach(cleanup)

describe('Async component', () => {
    const baseData: AsyncData<any> = {
        data: null,
        loading: false,
        error: undefined,
        reload: jest.fn()
    }

    it('Displays loading indicator', () => {
        const { queryByRole, rerender } = render(
            <Async state={ { ...baseData, loading: true } }/>
        )

        expect(queryByRole('progressbar')).toBeTruthy()

        rerender(<Async state={ baseData }/>)

        expect(queryByRole('progressbar')).toBeFalsy()
    })

    it('Displays custom loading component', () => {
        const { queryByText, rerender } = render(
            <Async
                state={ { ...baseData, loading: true } }
                LoadingComponent={ () => <span>Custom loader</span> }/>
        )

        expect(queryByText('Custom loader')).toBeTruthy()

        rerender(
            <Async
                state={ baseData }
                LoadingComponent={ () => <span>Custom loader</span> }/>
        )

        expect(queryByText('Custom loader')).toBeFalsy()
    })

    it('Displays error message', () => {
        const { queryByText, rerender } = render(
            <Async state={ { ...baseData, error: Error() } } errorMessage="Error occurred"/>
        )

        expect(queryByText('Error occurred')).toBeTruthy()

        rerender(<Async state={ baseData }/>)

        expect(queryByText('Error occurred')).toBeFalsy()
    })

    it('Displays custom error component', () => {
        const { queryByText, rerender } = render(
            <Async
                state={ { ...baseData, error: Error() } }
                ErrorComponent={ () => <span>Custom error</span> }/>
        )

        expect(queryByText('Custom error')).toBeTruthy()

        rerender(
            <Async
                state={ baseData }
                ErrorComponent={ () => <span>Custom error</span> }/>
        )

        expect(queryByText('Custom error')).toBeFalsy()
    })

    it('Only displays children if not loading and no error', () => {
        const { queryByText, rerender } = render(
            <Async state={ { ...baseData, data: 'Hi there', error: Error() } }>
                { data => <span>{ data }</span> }
            </Async>
        )

        expect(queryByText('Hi there')).toBeFalsy()

        rerender(
            <Async state={ { ...baseData, data: 'Hi there', loading: true } }>
                { data => <span>{ data }</span> }
            </Async>
        )

        expect(queryByText('Hi there')).toBeFalsy()

        rerender(
            <Async state={ { ...baseData, data: 'Hi there' } }>
                { data => <span>{ data }</span> }
            </Async>
        )

        expect(queryByText('Hi there')).toBeTruthy()
    })
})
