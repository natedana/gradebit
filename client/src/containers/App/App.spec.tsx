import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, fireEvent, render, wait } from '@testing-library/react'

import mockAxios from 'jest-mock-axios'

import '@testing-library/jest-dom/extend-expect'

import App from './App'

describe('App', () => {
    afterEach(() => {
        cleanup()
        mockAxios.reset()
    })

    it('Displays upload page', () => {
        const { queryAllByText } = render(
            <MemoryRouter initialEntries={ ['/'] }>
                <App/>
            </MemoryRouter>
        )

        expect(queryAllByText('Upload')).toBeTruthy()
    })

    it('Displays login page', () => {
        const { queryAllByText } = render(
            <MemoryRouter initialEntries={ ['/login'] }>
                <App/>
            </MemoryRouter>
        )

        expect(queryAllByText('Sign in')).toBeTruthy()
    })

    it('Displays vendor page when logged in', async () => {
        const { queryByText } = render(
            <MemoryRouter initialEntries={ ['/vendors'] }>
                <App/>
            </MemoryRouter>
        )

        expect(queryByText('Vendors (0)')).toBeFalsy()
        mockAxios.mockResponse({
            data: {
                username: 'test',
                isStaff: true,
                permissions: ['add_vendor']
            }
        })
        await wait()

        expect(queryByText('Vendors (0)')).toBeTruthy()
    })

    it('Displays files page when logged in', async () => {
        const { queryByText } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <App/>
            </MemoryRouter>
        )

        expect(queryByText('Files (0)')).toBeFalsy()

        mockAxios.mockResponse({
            data: {
                username: 'test',
                isStaff: true,
                permissions: ['add_file']
            }
        })
        await wait()

        expect(queryByText('Files (0)')).toBeTruthy()
    })

    it('Displays data sources page when logged in and permission enabled', async () => {
        const { queryByText, queryAllByText } = render(
            <MemoryRouter initialEntries={ ['/datasources'] }>
                <App/>
            </MemoryRouter>
        )

        expect(queryByText('Data Sources')).toBeFalsy()

        mockAxios.mockResponse({
            data: {
                username: 'test',
                isStaff: true,
                permissions: ['add_datasource']
            }
        })

        await wait()
        expect(queryAllByText('Data Sources')).toBeTruthy()
    })

    it('Does not display data sources page when logged in and permission disabled', async () => {
        const { queryByText } = render(
            <MemoryRouter initialEntries={ ['/datasources'] }>
                <App/>
            </MemoryRouter>
        )

        expect(queryByText('Data Sources')).toBeFalsy()

        mockAxios.mockResponse({
            data: {
                username: 'test',
                isStaff: true,
                permissions: []
            }
        })

        await wait()
        expect(queryByText('Data Sources')).toBeFalsy()
    })

    it('Opens and closes sidebar', async () => {
        const { queryByText, queryByTitle, getByTitle, getByText } = render(
            <MemoryRouter initialEntries={ ['/'] }>
                <App/>
            </MemoryRouter>
        )

        expect(queryByTitle('Open menu')).toBeFalsy()
        expect(queryByText('testuser')).toBeFalsy()

        mockAxios.mockResponse({
            data: {
                username: 'testuser',
                isStaff: true,
                permissions: []
            }
        })
        await wait()

        expect(getByText('testuser')).not.toBeVisible()
        fireEvent.click(getByTitle('Open menu'))
        expect(getByText('testuser')).toBeVisible()

        fireEvent.click(getByTitle('Close menu'))
        await wait(() => expect(getByText('testuser')).not.toBeVisible())
    })
})
