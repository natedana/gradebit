import React from 'react'
import { cleanup, fireEvent, render, wait, waitForElement } from '@testing-library/react'
import mockAxios from 'jest-mock-axios'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'

import Upload from './Upload'

import { getInputByLabel } from 'TestUtil'

describe('Upload component', () => {
    afterEach(() => {
        cleanup()
        mockAxios.reset()
    })

    const files = [new File([], 'file1.pdf')]

    it('Submits data to be uploaded when everything is filled out', async () => {
        const component = <Upload/>

        const { container, getByText, getByDisplayValue } = render(
            component
        )

        const uploadButton = getByText('Upload', { selector: 'button span' })
        expect(uploadButton).toBeDisabled()

        userEvent.type(getInputByLabel(container, 'Submitter Name'), 'John Doe')
        await waitForElement(() => getByDisplayValue('John Doe'), { container })
        expect(uploadButton).toBeDisabled()

        userEvent.type(getInputByLabel(container, 'Vendor Code'), '123456')
        await waitForElement(() => getByDisplayValue('123456'), { container })
        expect(uploadButton).toBeDisabled()

        const fileInput = getInputByLabel(container, 'Files')
        fireEvent.change(fileInput, { target: { files } })
        await waitForElement(() => getByText('file1.pdf'))

        expect(uploadButton).toBeEnabled()
        fireEvent.click(uploadButton)
        expect(mockAxios.post).toHaveBeenCalledWith('/api/pj/vendors/validate/', { code: '123456' }, { cancelToken: 'token' })
        mockAxios.mockResponse({ data: true })

        await waitForElement(() => getByText('Cancel', { selector: 'button span' }))

        expect(mockAxios.post).toHaveBeenCalledTimes(2)

        mockAxios.mockResponse()
        await waitForElement(() => getByText('Successfully uploaded 1 file'))
    })

    it('Shows vendor error help text for an invalid vendor code', async () => {
        const { container, getByText, getByDisplayValue } = render(
            <Upload/>
        )

        userEvent.type(getInputByLabel(container, 'Submitter Name'), 'John Doe')
        userEvent.type(getInputByLabel(container, 'Vendor Code'), '123456')
        fireEvent.change(getInputByLabel(container, 'Files'), { target: { files } })

        await waitForElement(() => [
            getByDisplayValue('John Doe'),
            getByDisplayValue('123456'),
            getByText('file1.pdf')
        ], { container })

        fireEvent.click(getByText('Upload', { selector: 'button span' }))

        mockAxios.mockResponse({ data: false })
        await waitForElement(() => getByText('Invalid vendor code.'))
    })

    it('Shows failed upload text on upload failure', async () => {
        const { container, getByText, getByDisplayValue } = render(
            <Upload/>
        )

        userEvent.type(getInputByLabel(container, 'Submitter Name'), 'John Doe')
        userEvent.type(getInputByLabel(container, 'Vendor Code'), '123456')
        fireEvent.change(getInputByLabel(container, 'Files'), { target: { files } })

        await waitForElement(() => [
            getByDisplayValue('John Doe'),
            getByDisplayValue('123456'),
            getByText('file1.pdf')
        ], { container })

        fireEvent.click(getByText('Upload', { selector: 'button span' }))

        mockAxios.mockResponse({ data: true })
        await wait()
        mockAxios.mockError()

        await waitForElement(() => getByText('Failed to upload file'))
    })

})
