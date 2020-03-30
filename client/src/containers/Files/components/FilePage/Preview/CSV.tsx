import React, { useCallback } from 'react'
import { titleCase } from 'change-case'
import parse from 'csv-parse'
import syncParse from 'csv-parse/lib/sync'

import { Grid, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

import { Column, Row } from '@devexpress/dx-react-grid'
import { Grid as DevExGrid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'

import { loadFileContent } from 'Api'
import { useApiData } from 'Util'

import Async from 'Components/Async'

import { File } from 'Types'

interface CSVProps {
    file: File
}

interface TableContent {
    rows: Row[]
    columns: Column[]
}

const delimiters: string[] = [',', ';', ':', '|', '\t']
const previewRowLimit = 25

const useStyles = makeStyles({
    table: {
        overflowX: 'auto'
    }
})

const CSV = ({ file }: CSVProps) => {
    const classes = useStyles()

    const findDelimiter = (fileString: string) => {
        const d = delimiters.find(delimiter => {
            try {
                syncParse(fileString, { to: previewRowLimit, trim: true, delimiter })
                return true
            } catch (error) {
                return false
            }
        })
        return d
    }

    const transformData = (data: string[][]): TableContent => {
        if (data.length === 0) {
            return {
                columns: [],
                rows: []
            }
        }
        const [headers, ...values] = data

        const columns = headers.map(name => ({
            name,
            title: titleCase(name)
        }))

        const rows = values.map(dataArray => {
            return dataArray.reduce<Row>((row, newDatum, j) => {
                const key = headers[j]
                row[key] = newDatum
                return row
            }, {})
        })

        return {
            columns,
            rows
        }
    }

    const loadData = useCallback(() => loadFileContent<string>(file.pk, 'text'), [file.pk])

    const load = useCallback(async () => {
        const response = await loadData()

        return new Promise<TableContent>((resolve, reject) => {
            const delimiter = findDelimiter(response)

            // Parse file
            parse(response, { delimiter, trim: true, to: previewRowLimit + 1 }, (err, results: any[]) => {
                if (err) {
                    return reject(err)
                }
                const tableData = transformData(results)
                resolve(tableData)
            })
        })
    }, [loadData])

    const content = useApiData<TableContent>(load, [load, file.pk, previewRowLimit])

    return (
        <Grid container justify="center">
            <Async state={ content }>
                { data => (
                    <>
                        <Typography component="div" align="center">Preview of the first { previewRowLimit } rows</Typography>
                        <div className={ classes.table }>
                            <DevExGrid
                                rows={ data.rows }
                                columns={ data.columns }>
                                <Table/>
                                <TableHeaderRow/>
                            </DevExGrid>
                        </div>
                    </>
                ) }
            </Async>
        </Grid>
    )
}

export default CSV
