import React from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import mockAxios from 'jest-mock-axios'

import { UserContext } from 'Contexts'

import VendorList from './VendorList'

describe('Vendor List', () => {
    afterEach(() => {
        cleanup()

        mockAxios.reset()
    })

    it('Shows a loading indicator when loading', () => {
        const { queryByText, queryByRole } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <VendorList onAddVendor={ () => null } onChooseVendor={ () => null }/>
            </MemoryRouter>
        )
        expect(queryByRole('progressbar')).toBeTruthy()
        expect(queryByText('Name')).toBeTruthy()
    })

    it('Shows an error indicator', async () => {
        const { findByText } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <VendorList onAddVendor={ () => null } onChooseVendor={ () => null }/>
            </MemoryRouter>
        )
        mockAxios.mockError(Error('Something bad'))
        await expect(findByText('Failed to load vendors')).resolves.toBeTruthy()
    })

    it('Shows a table of data', async () => {
        const vendors = {
            results: [{
                name: 'Test',
                code: 'abc123',
                dateAdded: new Date().toISOString(),
                pocs: [{
                    name: 'Bob'
                }]
            }],
            count: 1
        }

        const { findByText, queryByText, queryByRole } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <VendorList onAddVendor={ () => null } onChooseVendor={ () => null }/>
            </MemoryRouter>
        )
        mockAxios.mockResponse({ data: vendors })
        await expect(findByText('Test')).resolves.toBeTruthy()
        expect(queryByText('Bob')).toBeTruthy()
        expect(queryByText('Failed to load data')).toBeFalsy()
        expect(queryByRole('progressbar')).toBeFalsy()
    })

    it('Default sorting', async () => {
        const vendors = {
            results: [{
                name: 'Test',
                code: 'abc123',
                dateAdded: new Date().toISOString()
            },
            {
                name: 'Inc.',
                code: 'abc123',
                dateAdded: new Date().toISOString()
            },
            {
                name: 'ABC',
                code: 'abc123',
                dateAdded: new Date().toISOString()
            }],
            count: 3
        }

        const { container, findByText } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <VendorList onAddVendor={ () => null } onChooseVendor={ () => null }/>
            </MemoryRouter>
        )
        mockAxios.mockResponse({ data: vendors })
        await expect(findByText('Test')).resolves.toBeTruthy()

        const rows = container.querySelector('tbody').children

        expect(rows[0].children[0].innerHTML).toEqual('Test')
        expect(rows[1].children[0].innerHTML).toEqual('Inc.')
    })

    it('Chooses a vendor when clicking on a row', async () => {
        const vendors = {
            results: [{
                pk: 1,
                name: 'Test',
                code: 'abc123',
                dateAdded: new Date().toISOString()
            }]
        }

        const handleChooseVendor = jest.fn()

        const { findByText, getByText } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <VendorList onAddVendor={ () => null } onChooseVendor={ handleChooseVendor }/>
            </MemoryRouter>
        )
        mockAxios.mockResponse({ data: vendors })
        await expect(findByText('Test')).resolves.toBeTruthy()

        fireEvent.click(getByText('Test'))
        expect(handleChooseVendor).toBeCalledWith(1)
    })

    it('Can see the create button with the permission', async () => {
        const vendors = {
            results: [{
                pk: 1,
                name: 'Test',
                code: 'abc123',
                dateAdded: new Date().toISOString()
            }]
        }

        const handleChooseVendor = jest.fn()

        const { queryByTitle } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <UserContext.Provider value={ { permissions: ['add_vendor'] } }>
                    <VendorList onAddVendor={ () => null } onChooseVendor={ handleChooseVendor }/>
                </UserContext.Provider>
            </MemoryRouter>
        )

        mockAxios.mockResponse({ data: vendors })

        expect(queryByTitle('Create')).toBeTruthy()
    })

    it('Cannot see the create button without the permission', async () => {
        const vendors = {
            results: [{
                pk: 1,
                name: 'Test',
                code: 'abc123',
                dateAdded: new Date().toISOString()
            }]
        }

        const handleChooseVendor = jest.fn()

        const { queryByTitle } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <UserContext.Provider value={ { permissions: [] } }>
                    <VendorList onAddVendor={ () => null } onChooseVendor={ handleChooseVendor }/>
                </UserContext.Provider>
            </MemoryRouter>
        )

        mockAxios.mockResponse({ data: vendors })

        expect(queryByTitle('Create')).toBeFalsy()
    })
})
