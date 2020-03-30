import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { cleanup, fireEvent, render, wait, waitForElement } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import mockAxios from 'jest-mock-axios'

import { getInputByLabel } from 'TestUtil'

import DataSourceForm from './DataSourceForm'

describe('Data source form List', () => {
    afterEach(() => {
        cleanup()

        mockAxios.reset()
    })

    const fakeDataSource = {
        dataOrigin: 'do',
        dataType: 'dt',
        dateInformation: '1995-01-02',
        dateIngest: '1995-01-06',
        entities: 'e',
        frequency: 'f',
        leads: 'l',
        name: 'n',
        portfolio: 'port',
        priority: '3',
        requestMethod: 'rm',
        status: 's',
        theme: 't',
        updatePeriodically: 'up'
    }

    it('Submits info for the a new data source', async () => {
        const submit = jest.fn()

        const { container, getByText, getByDisplayValue } = render(
            <MemoryRouter initialEntries={ ['/datasources/create'] }>
                <Route path="/datasources/create" render={ props =>
                    <DataSourceForm onSubmit={ submit } { ...props }/>
                }/>
            </MemoryRouter>
        )

        // Wait for initial load
        await wait()

        const createButton = getByText('Create', { selector: 'button span' })

        userEvent.type(getInputByLabel(container, 'Name'), fakeDataSource.name)
        userEvent.type(getInputByLabel(container, 'Data Origin'), fakeDataSource.dataOrigin)
        userEvent.type(getInputByLabel(container, 'Date Information'), fakeDataSource.dateInformation)
        userEvent.type(getInputByLabel(container, 'Date Ingest'), fakeDataSource.dateIngest)
        userEvent.type(getInputByLabel(container, 'Data Type'), fakeDataSource.dataType)
        userEvent.type(getInputByLabel(container, 'Entities'), fakeDataSource.entities)
        userEvent.type(getInputByLabel(container, 'Frequency'), fakeDataSource.frequency)
        userEvent.type(getInputByLabel(container, 'Leads'), fakeDataSource.leads)
        userEvent.type(getInputByLabel(container, 'Portfolio'), fakeDataSource.portfolio)
        userEvent.type(getInputByLabel(container, 'Priority'), fakeDataSource.priority)
        userEvent.type(getInputByLabel(container, 'Status'), fakeDataSource.status)
        userEvent.type(getInputByLabel(container, 'Request Method'), fakeDataSource.requestMethod)
        userEvent.type(getInputByLabel(container, 'Theme'), fakeDataSource.theme)
        userEvent.type(getInputByLabel(container, 'Update Periodically'), fakeDataSource.updatePeriodically)

        await waitForElement(() => [
            getByDisplayValue(fakeDataSource.name),
            getByDisplayValue(fakeDataSource.dataOrigin),
            getByDisplayValue(fakeDataSource.dateInformation),
            getByDisplayValue(fakeDataSource.dateIngest),
            getByDisplayValue(fakeDataSource.dataType),
            getByDisplayValue(fakeDataSource.entities),
            getByDisplayValue(fakeDataSource.frequency),
            getByDisplayValue(fakeDataSource.leads),
            getByDisplayValue(fakeDataSource.portfolio),
            getByDisplayValue(fakeDataSource.priority),
            getByDisplayValue(fakeDataSource.status),
            getByDisplayValue(fakeDataSource.requestMethod),
            getByDisplayValue(fakeDataSource.theme),
            getByDisplayValue(fakeDataSource.updatePeriodically)
        ], { container })

        fireEvent.click(createButton)
        expect(submit).toBeCalledWith({
            ...fakeDataSource,
            pk: undefined
        })
    }, 10000)

    it('Submits info to edit a data source', async () => {
        const submit = jest.fn()

        const { container, getByText, getByDisplayValue } = render(
            <MemoryRouter initialEntries={ ['/datasources/1'] }>
                <Route path="/datasources/:dataSourcePk" render={ props =>
                    <DataSourceForm onSubmit={ submit } { ...props }/>
                }/>
            </MemoryRouter>
        )

        expect(mockAxios.get).toHaveBeenCalledWith('/api/pj/datasources/1/', { cancelToken: 'token' })
        mockAxios.mockResponse({
            data: fakeDataSource
        })
        await wait()

        const updateButton = getByText('Update', { selector: 'button span' })

        await waitForElement(() => [
            getByDisplayValue(fakeDataSource.name),
            getByDisplayValue(fakeDataSource.dataOrigin),
            getByDisplayValue(fakeDataSource.dateInformation),
            getByDisplayValue(fakeDataSource.dateIngest),
            getByDisplayValue(fakeDataSource.dataType),
            getByDisplayValue(fakeDataSource.entities),
            getByDisplayValue(fakeDataSource.frequency),
            getByDisplayValue(fakeDataSource.leads),
            getByDisplayValue(fakeDataSource.portfolio),
            getByDisplayValue(fakeDataSource.priority),
            getByDisplayValue(fakeDataSource.status),
            getByDisplayValue(fakeDataSource.requestMethod),
            getByDisplayValue(fakeDataSource.theme),
            getByDisplayValue(fakeDataSource.updatePeriodically)
        ], { container })

        fireEvent.click(updateButton)

        expect(submit).toBeCalledWith({
            ...fakeDataSource,
            pk: '1'
        })
    }, 10000)

    it('Shows an error', async () => {
        const submit = jest.fn()

        submit.mockImplementation(() => {
            throw new Error('👹')
        })

        const { container, getByText, getByDisplayValue, queryByText } = render(
            <MemoryRouter initialEntries={ ['/datasources/create'] }>
                <Route path="/datasources/create" render={ props =>
                    <DataSourceForm onSubmit={ submit } { ...props }/>
                }/>
            </MemoryRouter>
        )

        // Wait for initial load
        await wait()

        const createButton = getByText('Create', { selector: 'button span' })

        userEvent.type(getInputByLabel(container, 'Name'), fakeDataSource.name)
        userEvent.type(getInputByLabel(container, 'Data Origin'), fakeDataSource.dataOrigin)
        userEvent.type(getInputByLabel(container, 'Date Information'), fakeDataSource.dateInformation)
        userEvent.type(getInputByLabel(container, 'Date Ingest'), fakeDataSource.dateIngest)
        userEvent.type(getInputByLabel(container, 'Data Type'), fakeDataSource.dataType)
        userEvent.type(getInputByLabel(container, 'Entities'), fakeDataSource.entities)
        userEvent.type(getInputByLabel(container, 'Frequency'), fakeDataSource.frequency)
        userEvent.type(getInputByLabel(container, 'Leads'), fakeDataSource.leads)
        userEvent.type(getInputByLabel(container, 'Portfolio'), fakeDataSource.portfolio)
        userEvent.type(getInputByLabel(container, 'Priority'), fakeDataSource.priority)
        userEvent.type(getInputByLabel(container, 'Status'), fakeDataSource.status)
        userEvent.type(getInputByLabel(container, 'Request Method'), fakeDataSource.requestMethod)
        userEvent.type(getInputByLabel(container, 'Theme'), fakeDataSource.theme)
        userEvent.type(getInputByLabel(container, 'Update Periodically'), fakeDataSource.updatePeriodically)

        await waitForElement(() => [
            getByDisplayValue(fakeDataSource.name),
            getByDisplayValue(fakeDataSource.dataOrigin),
            getByDisplayValue(fakeDataSource.dateInformation),
            getByDisplayValue(fakeDataSource.dateIngest),
            getByDisplayValue(fakeDataSource.dataType),
            getByDisplayValue(fakeDataSource.entities),
            getByDisplayValue(fakeDataSource.frequency),
            getByDisplayValue(fakeDataSource.leads),
            getByDisplayValue(fakeDataSource.portfolio),
            getByDisplayValue(fakeDataSource.priority),
            getByDisplayValue(fakeDataSource.status),
            getByDisplayValue(fakeDataSource.requestMethod),
            getByDisplayValue(fakeDataSource.theme),
            getByDisplayValue(fakeDataSource.updatePeriodically)
        ], { container })

        fireEvent.click(createButton)
        expect(submit).toBeCalledWith({
            ...fakeDataSource,
            pk: undefined
        })
        await wait()
        expect(queryByText('Failed to create data source.')).toBeTruthy()
    }, 10000)
})
