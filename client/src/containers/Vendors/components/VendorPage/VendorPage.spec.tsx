import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { cleanup, render } from '@testing-library/react'

import mockAxios from 'jest-mock-axios'

import VendorPage from './VendorPage'

describe('Vendor Page', () => {
    afterEach(() => {
        cleanup()

        mockAxios.reset()
    })

    it('Shows a loading indicator when loading', () => {
        const { queryAllByRole } = render(
            <MemoryRouter initialEntries={ ['/vendors/1'] }>
                <Route path="/vendors/:vendorPk" render={ props =>
                    <VendorPage { ...props } onChooseFile={ () => null } onEditVendor={ () => null }/>
                }/>
            </MemoryRouter>
        )

        expect(queryAllByRole('progressbar')).toBeTruthy()
    })

    it('Shows an error indicator', async () => {
        const { findByText } = render(
            <MemoryRouter initialEntries={ ['/vendors/1'] }>
                <Route path="/vendors/:vendorPk" render={ props =>
                    <VendorPage { ...props } onChooseFile={ () => null } onEditVendor={ () => null }/>
                }/>
            </MemoryRouter>
        )
        mockAxios.mockError(Error('Something bad'))

        await expect(findByText('Failed to load vendor')).resolves.toBeTruthy()
    })

    it('Shows the file list of the vendor', async () => {
        const vendor = {
            name: 'Test',
            shortName: 'test',
            code: 'abc123',
            dateAdded: new Date().toISOString(),
            pocs: [{
                pk: 'this is a PK',
                name: 'Bob'
            }]
        }

        const { findByText } = render(
            <MemoryRouter initialEntries={ ['/vendors/1'] }>
                <Route path="/vendors/:vendorPk" render={ props =>
                    <VendorPage { ...props } onChooseFile={ () => null } onEditVendor={ () => null }/>
                }/>
            </MemoryRouter>
        )

        mockAxios.mockResponse({ data: vendor })

        await expect(findByText('Test (abc123)')).toBeTruthy()
    })
})
