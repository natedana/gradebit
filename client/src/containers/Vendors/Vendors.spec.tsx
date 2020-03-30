import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { cleanup, render } from '@testing-library/react'

import Vendors from './Vendors'
import { UserContext } from 'Contexts'

afterEach(cleanup)

it('Displays vendor list page', async () => {
    const { queryByText } = render(
        <MemoryRouter initialEntries={ ['/vendors'] }>
            <Route path="/vendors" component={ Vendors }/>
        </MemoryRouter>
    )

    expect(queryByText('Vendors (0)')).toBeTruthy()
})

it('Displays vendor details page', () => {
    const { queryByText } = render(
        <MemoryRouter initialEntries={ ['/vendors/1'] }>
            <Route path="/vendors" component={ Vendors }/>
        </MemoryRouter>
    )

    expect(queryByText('Vendors (0)')).toBeFalsy()
})

it('Displays create vendor page', () => {
    const { queryByText } = render(
        <MemoryRouter initialEntries={ ['/vendors/add'] }>
            <UserContext.Provider value={ { permissions: ['add_vendor'] } }>
                <Route path="/vendors" component={ Vendors }/>
            </UserContext.Provider>
        </MemoryRouter>
    )

    expect(queryByText('New Vendor')).toBeTruthy()
})

it('Displays edit vendor page', () => {
    const { queryByText } = render(
        <MemoryRouter initialEntries={ ['/vendors/1/edit'] }>
            <Route path="/vendors" component={ Vendors }/>
        </MemoryRouter>
    )

    expect(queryByText('Edit Vendor')).toBeTruthy()
})
