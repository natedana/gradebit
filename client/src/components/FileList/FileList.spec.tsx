import React from 'react'
import { cleanup, fireEvent, render, wait } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import copy from 'copy-to-clipboard'

import mockAxios from 'jest-mock-axios'
import '@testing-library/jest-dom/extend-expect'

import FileList from './FileList'

import { Vendor } from 'Types'
import { UserContext } from 'Contexts'

describe('File list', () => {

    const vendor: Vendor = {
        pk: '1',
        name: 'Acme',
        shortName: 'acme',
        code: '123456',
        dateAdded: '2019-04-21T19:00:00-04:00',
        autoApprove: false,
        fileCount: 0,
        pocs: [{
            pk: '1',
            name: 'Bob',
            email: 'bob@test.com',
            phone: '5555555555'
        }]
    }

    const files = {
        results: [
            {
                pk: '1',
                name: 'test.txt',
                location: 'file:///tmp',
                key: 'test.txt',
                size: 4000,
                vendor: {
                    name: 'Acme, Inc.',
                    code: '123456'
                },
                submitter: 'John Doe',
                dateUploaded: '2001-09-27T19:00:00-04:00',
                dateApproved: '2001-09-27T19:00:00-04:00',
                approved: true,
                status: 'unscanned',
                message: ''
            },
            {
                pk: '2',
                name: 'abc.txt',
                location: 'file:///tmp',
                key: 'test.txt',
                size: 4000,
                vendor: {
                    name: 'Acme, Inc.',
                    code: '123456'
                },
                submitter: 'John Doe',
                dateUploaded: '2001-09-27T19:00:00-04:00',
                dateApproved: '2001-09-27T19:00:00-04:00',
                approved: true,
                status: 'clean',
                message: ''
            },
            {
                pk: '3',
                name: 'inc.txt',
                location: 'file:///tmp',
                key: 'test.txt',
                size: 4000,
                vendor: {
                    name: 'Acme, Inc.',
                    code: '123456'
                },
                submitter: 'John Doe',
                dateUploaded: '2001-09-27T19:00:00-04:00',
                dateApproved: '2001-09-27T19:00:00-04:00',
                approved: true,
                status: 'failed',
                message: ''
            }
        ],
        count: 3
    }

    afterEach(() => {
        cleanup()

        mockAxios.reset()
    })

    it('Shows a loading indicator when loading', () => {
        const { queryByText, queryByRole, queryAllByRole } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <FileList onChooseFile={ jest.fn() } vendor={ vendor }/>
            </MemoryRouter>
        )

        expect(queryAllByRole('progressbar')).toBeTruthy()
        expect(queryByText('Name')).toBeTruthy()
    })

    it('Shows an error indicator', async () => {
        const { findByText } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <FileList onChooseFile={ jest.fn() }/>
            </MemoryRouter>
        )

        mockAxios.mockError(Error('Something bad'))
        await expect(findByText('Failed to load files')).resolves.toBeTruthy()
    })

    it('Shows a table of data', async () => {
        const handleChooseFile = jest.fn()

        const { findByText, getByText, queryByText, queryByRole } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <FileList vendor={ vendor } onChooseFile={ handleChooseFile }/>
            </MemoryRouter>
        )

        mockAxios.mockResponse({ data: files })
        await expect(findByText('Name')).resolves.toBeTruthy()
        expect(queryByText('Failed to load data')).toBeFalsy()
        expect(queryByRole('progressbar')).toBeFalsy()

        fireEvent.click(getByText('test.txt'))
        expect(handleChooseFile).toHaveBeenCalledWith('1')
    })

    it('Default sorting', async () => {
        const { container, getAllByTitle, findByText, queryByText } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <FileList vendor={ vendor } onChooseFile={ jest.fn() }/>
            </MemoryRouter>
        )
        mockAxios.mockResponse({ data: files })

        await expect(findByText('test.txt')).resolves.toBeTruthy()
        const rows = container.querySelector('tbody').children

        expect(rows[0].children[1].innerHTML).toEqual('<span class="">test.txt</span>')
        expect(rows[1].children[1].innerHTML).toEqual('<span class="">abc.txt</span>')
        expect(rows[2].children[1].innerHTML).toEqual('<span class="">inc.txt</span>')

        fireEvent.click(getAllByTitle('Copy vendor code')[0])
        expect(copy).toHaveBeenCalledWith('123456')

        expect(findByText('Vendor code copied to clipboard')).resolves.toBeTruthy()
        await wait(() => expect(queryByText('Vendor code copied to clipboard')).toBeFalsy())
    }, 10000)

    it('Shows and handles action buttons', async () => {
        const { container, queryByTitle, findByText } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <UserContext.Provider value={ { permissions: ['change_file'] } }>
                    <FileList vendor={ vendor } onChooseFile={ jest.fn() }/>
                </UserContext.Provider>
            </MemoryRouter>
        )
        mockAxios.mockResponse({ data: files })

        await expect(findByText('test.txt')).resolves.toBeTruthy()

        expect(queryByTitle('Delete')).toBeFalsy()
        expect(queryByTitle('Approve')).toBeFalsy()
        expect(queryByTitle('Retry')).toBeFalsy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[0])

        expect(queryByTitle('Delete')).toBeTruthy()
        expect(queryByTitle('Approve')).toBeFalsy()
        expect(queryByTitle('Retry')).toBeFalsy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[1])

        expect(queryByTitle('Delete')).toBeTruthy()
        expect(queryByTitle('Approve')).toBeTruthy()
        expect(queryByTitle('Retry')).toBeFalsy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[2])

        expect(queryByTitle('Delete')).toBeTruthy()
        expect(queryByTitle('Approve')).toBeTruthy()
        expect(queryByTitle('Retry')).toBeTruthy()
    })

    it('Permissions disallow approval', async () => {
        const { container, queryByTitle, findByText } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <UserContext.Provider value={ { permissions: [] } }>
                    <FileList vendor={ vendor } onChooseFile={ jest.fn() }/>
                </UserContext.Provider>
            </MemoryRouter>
        )
        mockAxios.mockResponse({ data: files })

        await expect(findByText('test.txt')).resolves.toBeTruthy()

        expect(queryByTitle('Delete')).toBeFalsy()
        expect(queryByTitle('Approve')).toBeFalsy()
        expect(queryByTitle('Retry')).toBeFalsy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[0])

        expect(queryByTitle('Delete')).toBeTruthy()
        expect(queryByTitle('Approve')).toBeFalsy()
        expect(queryByTitle('Retry')).toBeFalsy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[1])

        expect(queryByTitle('Delete')).toBeTruthy()
        expect(queryByTitle('Approve')).toBeFalsy()
        expect(queryByTitle('Retry')).toBeFalsy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[2])

        expect(queryByTitle('Delete')).toBeTruthy()
        expect(queryByTitle('Approve')).toBeFalsy()
        expect(queryByTitle('Retry')).toBeTruthy()
    })

    it('Handles action buttons', async () => {
        const { container, getByTitle, queryByTitle, findByText } = render(
            <MemoryRouter initialEntries={ ['/files'] }>
                <UserContext.Provider value={ { permissions: ['change_file'] } }>
                    <FileList vendor={ vendor } onChooseFile={ jest.fn() }/>
                </UserContext.Provider>
            </MemoryRouter>
        )
        mockAxios.mockResponse({ data: files })

        await expect(findByText('test.txt')).resolves.toBeTruthy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[1])
        fireEvent.click(getByTitle('Approve'))

        expect(mockAxios.post).toHaveBeenCalledWith('/api/pj/files/approve_bulk/', ['2'], { cancelToken: 'token' })
        mockAxios.mockResponse()
        await wait()
        mockAxios.mockResponse({ data: files })
        await wait()
        expect(queryByTitle('Approve')).toBeFalsy()

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[2])
        fireEvent.click(getByTitle('Retry'))

        expect(mockAxios.post).toHaveBeenCalledWith('/api/pj/files/retry_bulk/', ['3'], { cancelToken: 'token' })
        mockAxios.mockResponse()
        await wait()
        mockAxios.mockResponse({ data: files })
        await wait()
        expect(queryByTitle('Retry')).toBeFalsy()

        const originalConfirm = window.confirm
        window.confirm = jest.fn(() => true)

        fireEvent.click(container.querySelectorAll('tbody input[type=checkbox]')[0])
        fireEvent.click(getByTitle('Delete'))

        expect(mockAxios.post).toHaveBeenCalledWith('/api/pj/files/delete_bulk/', ['1'], { cancelToken: 'token' })
        mockAxios.mockResponse()
        await wait()
        expect(queryByTitle('Delete')).toBeFalsy()

        window.confirm = originalConfirm
    }, 10000)
})
