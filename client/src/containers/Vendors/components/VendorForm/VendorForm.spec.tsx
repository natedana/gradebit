import React from 'react'
import { cleanup, fireEvent, render, wait, waitForElement } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

import mockAxios from 'jest-mock-axios'

import { getInputByLabel } from 'TestUtil'

import VendorForm from './VendorForm'

describe('Vendor Form', () => {
    afterEach(() => {
        cleanup()

        mockAxios.reset()
    })

    const fakeVendor = {
        name: 'name',
        shortName: 'sname',
        autoApprove: false,
        approvalRegex: '',
        priority: 6,
        pocs: [{
            name: 'poc name',
            email: '',
            phone: ''
        }]
    }

    it('Submits info for the new vendor', async () => {
        const submit = jest.fn()

        const { container, getByText, getByDisplayValue } = render(
            <MemoryRouter initialEntries={ ['/vendors/create'] }>
                <Route path="/vendors/create" render={ props => (
                    <VendorForm onSubmit={ submit } { ...props }/>
                ) }/>
            </MemoryRouter>
        )

        // Wait for initial load
        await wait()

        const createButton = getByText('Create', { selector: 'button span' })

        userEvent.type(getInputByLabel(container, 'Vendor name'), fakeVendor.name)
        userEvent.type(getInputByLabel(container, 'Short name (for URL generation)'), fakeVendor.shortName)
        userEvent.type(getInputByLabel(container, 'Vendor priority'), fakeVendor.priority.toString())
        userEvent.type(getInputByLabel(container, 'Name'), fakeVendor.pocs[0].name)

        await waitForElement(() => [
            getByDisplayValue(fakeVendor.name),
            getByDisplayValue(fakeVendor.shortName)
        ], { container })

        fireEvent.click(createButton)
        expect(submit).toBeCalledWith({
            ...fakeVendor,
            pk: undefined
        })
    })

    it('Submits info to edit a vendor', async () => {
        const submit = jest.fn()

        const { container, getByText, getByDisplayValue } = render(
            <MemoryRouter initialEntries={ ['/vendors/1/edit'] }>
                <Route path="/vendors/:vendorPk/edit" render={ props => (
                    <VendorForm onSubmit={ submit } { ...props }/>
                ) }/>
            </MemoryRouter>
        )

        mockAxios.mockResponse({
            data: fakeVendor
        })
        await wait()

        const submitButton = getByText('Update', { selector: 'button span' })

        await waitForElement(() => [
            getByDisplayValue(fakeVendor.name),
            getByDisplayValue(fakeVendor.shortName)
        ], { container })

        fireEvent.click(submitButton)
        expect(submit).toBeCalledWith({
            ...fakeVendor,
            pk: '1'
        })
    })

    it('Displays an error', async () => {
        const submit = jest.fn()

        submit.mockImplementation(() => {
            throw new Error('err')
        })

        const { queryByText, container, getByDisplayValue, getByText } = render(
            <MemoryRouter initialEntries={ ['/vendors/create'] }>
                <Route path="/vendors/create" render={ props => (
                    <VendorForm onSubmit={ submit } { ...props }/>
                ) }/>
            </MemoryRouter>
        )

        // Wait for initial load
        await wait()

        const submitButton = getByText('Create', { selector: 'button span' })

        userEvent.type(getInputByLabel(container, 'Vendor name'), fakeVendor.name)
        userEvent.type(getInputByLabel(container, 'Short name (for URL generation)'), fakeVendor.shortName)

        await waitForElement(() => [
            () => getByDisplayValue(fakeVendor.name),
            () => getByDisplayValue(fakeVendor.shortName)
        ], { container })

        fireEvent.click(submitButton)
        await wait()
        expect(queryByText('Failed to create vendor.')).toBeTruthy()
    })
})
